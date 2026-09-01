import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, authorize } from '../middleware/auth';
import { hashPassword } from '../lib/auth';
import { registerSchema, updateUserSchema, RegisterInput, UpdateUserInput } from '../lib/validation';

const router = Router();

/**
 * GET /api/users
 * Get all users with search, role filtering, status filtering, and count statistics (Admin only)
 */
router.get('/', authenticate, authorize('ADMIN'), async (req: Request, res: Response) => {
  try {
    const search = ((req.query.search || req.query.q || '') as string).trim();
    const role = (req.query.role as string)?.toUpperCase();
    const status = (req.query.status as string)?.toLowerCase();

    // Build filter conditions
    const where: any = {};

    if (role && role !== 'ALL') {
      where.role = role;
    }

    if (status === 'active') {
      where.isActive = true;
    } else if (status === 'inactive') {
      where.isActive = false;
    }

    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { staffProfile: { fullName: { contains: search, mode: 'insensitive' } } },
        { staffProfile: { phone: { contains: search, mode: 'insensitive' } } },
        { staffProfile: { specialization: { contains: search, mode: 'insensitive' } } },
        { staffProfile: { licenseNo: { contains: search, mode: 'insensitive' } } },
        { staffProfile: { departmentId: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [users, allUsersCount, activeCount, inactiveCount, doctorsCount, nursesCount, labTechsCount, receptionistsCount, adminsCount] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          staffProfile: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({ where: { isActive: false } }),
      prisma.user.count({ where: { role: 'DOCTOR' } }),
      prisma.user.count({ where: { role: 'NURSE' } }),
      prisma.user.count({ where: { role: 'LAB_TECH' } }),
      prisma.user.count({ where: { role: 'RECEPTIONIST' } }),
      prisma.user.count({ where: { role: 'ADMIN' } }),
    ]);

    // Remove password hashes from response
    const usersWithoutPasswords = users.map(user => {
      const { passwordHash: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });

    res.json({
      users: usersWithoutPasswords,
      total: usersWithoutPasswords.length,
      counts: {
        total: allUsersCount,
        active: activeCount,
        inactive: inactiveCount,
        doctors: doctorsCount,
        nurses: nursesCount,
        labTechs: labTechsCount,
        receptionists: receptionistsCount,
        admins: adminsCount,
      },
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      error: 'Failed to fetch users',
      message: 'An error occurred while fetching users',
    });
  }
});

/**
 * POST /api/users
 * Create a new staff member (Admin only)
 */
router.post('/', authenticate, authorize('ADMIN'), async (req: Request, res: Response) => {
  try {
    const validatedData: RegisterInput = registerSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({
      where: { username: validatedData.username },
    });

    if (existingUser) {
      return res.status(400).json({
        error: 'User already exists',
        message: 'A staff member with this username already exists',
      });
    }

    const passwordHash = await hashPassword(validatedData.password);

    const user = await prisma.user.create({
      data: {
        username: validatedData.username,
        email: validatedData.email,
        passwordHash,
        role: validatedData.role,
        isActive: true,
        staffProfile: {
          create: {
            fullName: validatedData.fullName,
            phone: validatedData.phone,
            specialization: validatedData.specialization || null,
            licenseNo: validatedData.licenseNo || null,
            departmentId: validatedData.departmentId || null,
          },
        },
      },
      include: {
        staffProfile: true,
      },
    });

    const { passwordHash: _, ...userWithoutPassword } = user;

    res.status(201).json({
      message: 'Staff member created successfully',
      user: userWithoutPassword,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Validation error',
        message: error.message,
      });
    }

    console.error('Create staff error:', error);
    res.status(500).json({
      error: 'Failed to create staff member',
      message: 'An error occurred while creating staff member',
    });
  }
});

/**
 * GET /api/users/:id
 * Get user by ID
 */
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = Array.isArray(id) ? id[0] : id;

    // Users can only view their own profile unless they're admin
    if (req.user?.role !== 'ADMIN' && req.user?.userId !== id) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only view your own profile',
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        staffProfile: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User not found',
      });
    }

    const { passwordHash: _, ...userWithoutPassword } = user;

    res.json({
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      error: 'Failed to fetch user',
      message: 'An error occurred while fetching user',
    });
  }
});

/**
 * PATCH /api/users/:id
 * Update user (Admin or own profile)
 */
router.patch('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = Array.isArray(id) ? id[0] : id;

    // Users can only update their own profile unless they're admin
    if (req.user?.role !== 'ADMIN' && req.user?.userId !== id) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only update your own profile',
      });
    }

    // Validate input
    const validatedData: UpdateUserInput = updateUserSchema.parse(req.body);

    // Only admins can change role and isActive
    if (req.user?.role !== 'ADMIN') {
      delete (validatedData as any).role;
      delete (validatedData as any).isActive;
    }

    let passwordHashUpdate: string | undefined = undefined;
    if (validatedData.password && req.user?.role === 'ADMIN') {
      passwordHashUpdate = await hashPassword(validatedData.password);
    }

    // Update user
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(validatedData.email !== undefined && { email: validatedData.email }),
        ...(passwordHashUpdate && { passwordHash: passwordHashUpdate }),
        ...(validatedData.role && req.user?.role === 'ADMIN' && { role: validatedData.role }),
        ...(validatedData.isActive !== undefined && req.user?.role === 'ADMIN' && { isActive: validatedData.isActive }),
        staffProfile: (validatedData.fullName || validatedData.phone || validatedData.specialization !== undefined || validatedData.licenseNo !== undefined || validatedData.departmentId !== undefined)
          ? {
              upsert: {
                create: {
                  fullName: validatedData.fullName || '',
                  phone: validatedData.phone || '',
                  specialization: validatedData.specialization || null,
                  licenseNo: validatedData.licenseNo || null,
                  departmentId: validatedData.departmentId || null,
                },
                update: {
                  ...(validatedData.fullName && { fullName: validatedData.fullName }),
                  ...(validatedData.phone && { phone: validatedData.phone }),
                  ...(validatedData.specialization !== undefined && { specialization: validatedData.specialization || null }),
                  ...(validatedData.licenseNo !== undefined && { licenseNo: validatedData.licenseNo || null }),
                  ...(validatedData.departmentId !== undefined && { departmentId: validatedData.departmentId || null }),
                },
              },
            }
          : undefined,
      },
      include: {
        staffProfile: true,
      },
    });

    const { passwordHash: _, ...userWithoutPassword } = user;

    res.json({
      message: 'Staff member updated successfully',
      user: userWithoutPassword,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Validation error',
        message: error.message,
      });
    }

    console.error('Update user error:', error);
    res.status(500).json({
      error: 'Failed to update user',
      message: 'An error occurred while updating user',
    });
  }
});

/**
 * DELETE /api/users/:id
 * Delete user (Admin only)
 */
router.delete('/:id', authenticate, authorize('ADMIN'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = Array.isArray(id) ? id[0] : id;

    // Prevent deleting yourself
    if (req.user?.userId === userId) {
      return res.status(400).json({
        error: 'Cannot delete yourself',
        message: 'You cannot delete your own account',
      });
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    res.json({
      message: 'Staff member deleted successfully',
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      error: 'Failed to delete user',
      message: 'An error occurred while deleting user',
    });
  }
});

export default router;
