// // Here is copy-paste sample data to run a full end-to-end patient workflow through all roles in the system: **Receptionist → Nurse → Doctor → Lab Specialist → Doctor → Receptionist**.

// ---

// ## 1️⃣ STEP 1: Receptionist (Patient Registration & Check-In)
// 🌐 **URL**: [http://localhost:3000/dashboard/receptionist](http://localhost:3000/dashboard/receptionist)  
// 🔐 **Login**: `receptionist` / `Reception@123`

// ### 📋 Form Fields to Fill:
// * **First Name**: `Michael`
// * **Last Name**: `Sterling`
// * **Gender**: `Male`
// * **Date of Birth**: `1988-05-14`
// * **Phone**: `+1 (555) 234-5678`
// * **Emergency Contact**: `Sarah Sterling (+1 555-987-6543)`
// * **Chief Complaint**: `Persistent fever, severe fatigue, and chills for 4 days.`
// * **Visit Status / Queue**: Select **`TRIAGE`** (Send to Nurse Queue).
// * **Action**: Click **Register & Send to Triage**.

// ---

// ## 2️⃣ STEP 2: Nurse (Triage & Vital Signs Entry)
// 🌐 **URL**: [http://localhost:3000/dashboard/nurse](http://localhost:3000/dashboard/nurse)  
// 🔐 **Login**: `nurse` / `Nurse@123`

// ### 📋 Form Fields to Fill:
// 1. Select Patient: **Michael Sterling**
// 2. Input Vitals:
//    * **Blood Pressure**: `135` / `88` `mmHg`
//    * **Heart Rate (Pulse)**: `102` `bpm`
//    * **Temperature**: `38.9` `°C`
//    * **Oxygen Saturation (SpO2)**: `96` `%`
//    * **Respiratory Rate**: `20` `breaths/min`
//    * **Weight / Height**: `78` `kg` / `175` `cm`
// 3. **Nurse Triage Notes**:
//    ```text
//    Patient presents with high-grade fever (38.9°C), elevated heart rate (102 bpm), and mild diaphoresis. Patient alert and oriented x3. Sent to Doctor Queue.
//    ```
// 4. **Action**: Select Doctor **`Dr. James Wilson`** and click **Complete Triage & Transfer**.

// ---

// ## 3️⃣ STEP 3: Doctor (Initial Consultation & Lab Order Creation)
// 🌐 **URL**: [http://localhost:3000/dashboard/doctor](http://localhost:3000/dashboard/doctor)  
// 🔐 **Login**: `doctor` / `Doctor@123`

// ### 📋 Form Fields to Fill:
// 1. Select Patient **Michael Sterling** from *Today's Patients* list.
// 2. Go to **Clinical Encounter** tab:
//    * **Subjective (HPI)**:
//      ```text
//      38yo male presents with 4-day history of high fever, chills, generalized muscle aches, and progressive fatigue. Denies cough or shortness of breath.
//      ```
//    * **Objective (Physical Exam)**:
//      ```text
//      Alert, febrile (38.9°C). Oropharynx clear, chest clear to auscultation bilaterally. S1/S2 present, no murmurs. Mild splenomegaly on abdominal palpation.
//      ```
// 3. Go to **Lab Orders** tab:
//    * **Test Name**: `Complete Blood Count (CBC) Panel & Smear`
//    * **Priority**: Select **`URGENT`**
//    * **Assigned Technician**: Select **`Lab Tech`**
//    * **Notes**: `Evaluate for severe leukocytosis, anemia, or acute bacterial infection.`
//    * Click **Create & Assign Lab Order**.

// ---

// ## 4️⃣ STEP 4: Lab Specialist (Result & Flag Entry)
// 🌐 **URL**: [http://localhost:3000/dashboard/laboratorist](http://localhost:3000/dashboard/laboratorist)  
// 🔐 **Login**: `labtech` / `Lab@123`

// ### 📋 Form Fields to Fill:
// 1. Under **My Assignments**, click **Accept** on the pending order for **Michael Sterling**.
// 2. Click **Enter Results** action button to open the modal:
//    * **Result Value**: `19.5`
//    * **Unit**: `x10^3/µL`
//    * **Reference Range**: `4.5 - 11.0 x10^3/µL`
//    * **Flag Indicator**: Select **`H` (High)**
//    * **Technician Notes**:
//      ```text
//      Severe leukocytosis with prominent neutrophilia and left shift noted on smear.
//      ```
// 3. **Action**: Click **Save & Complete Order**.

// ---

// ## 5️⃣ STEP 5: Doctor (Review Results, CDS Rules & Save Encounter)
// 🌐 **URL**: [http://localhost:3000/dashboard/doctor](http://localhost:3000/dashboard/doctor)  
// 🔐 **Login**: `doctor` / `Doctor@123`

// ### 📋 Actions & Form Fields:
// 1. Re-select **Michael Sterling**.
// 2. Notice the yellow banner: **`⚠️ Abnormal Lab Results Alert: Complete Blood Count - 19.5 x10^3/µL (Flag: H)`**
// 3. Go to **Clinical Encounter** tab:
//    * Click **Auto-populate Lab Summary** in the Objective section.
//    * Under **Clinical Decision Support (CDS) Suggestions**, click **`+ Apply CDS to Plan & Interpretation`**.
//    * Verify the pre-filled fields:
//      * **Lab Result Interpretation**:
//        ```text
//        Severe neutrophilic leukocytosis (19.5 x10^3/µL [H]) consistent with acute systemic bacterial infection or inflammatory process. No blast cells observed.
//        ```
//      * **Assessment (Diagnosis)**:
//        ```text
//        Acute systemic bacterial infection / Severe Leukocytosis. Rule out focal infection.
//        ```
//      * **Plan**:
//        ```text
//        1. Initiate empirical broad-spectrum antibiotic therapy (Amoxicillin-Clavulanate 875/125mg PO BID x 7d).
//        2. Antipyretic therapy (Acetaminophen 500mg PO q6h PRN fever >38.5°C).
//        3. Oral hydration (2-3L/day).
//        4. Repeat CBC panel in 48-72 hours.
//        ```
//      * **ICD-10 Code**: `D72.829`
// 4. **Action**: Click **Save Encounter**.

// ---

// ## 6️⃣ STEP 6: Receptionist (Check-Out & Payment Settlement)
// 🌐 **URL**: [http://localhost:3000/dashboard/receptionist](http://localhost:3000/dashboard/receptionist)  
// 🔐 **Login**: `receptionist` / `Reception@123`

// ### 📋 Actions & Settlement:
// 1. Select **Michael Sterling** from the Billing & Check-Out queue.
// 2. Review Itemized Invoice Charges:
//    * Doctor Consultation Fee: `$50.00`
//    * Urgent CBC Lab Test Fee: `$45.00`
//    * **Total Amount Due**: `$95.00`
// 3. Select Payment Method: **`Cash`** / **`Card`**
// 4. Enter Amount Paid: `$95.00`
// 5. Click **Process Payment & Finalize Check-Out**.
// 6. Status updates to: **`COMPLETED / DISCHARGED`** 🎉

function getBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/$/, '') || '';
  if (!envUrl) {
    return 'http://localhost:4000/api';
  }
  // Ensure the /api suffix is present if user provided base origin
  if (!envUrl.endsWith('/api')) {
    return `${envUrl}/api`;
  }
  return envUrl;
}

const BASE_URL = getBaseUrl();

class ApiClient {
  private refreshPromise: Promise<boolean> | null = null;

  // These methods are kept for backward compatibility but do nothing
  // since we now use HTTP-only cookies
  setToken(_token: string) {
    // No-op: tokens are stored in cookies by the backend
  }

  clearToken() {
    // No-op: cookies are cleared by the backend on logout
  }

  private async refreshAccessToken(): Promise<boolean> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        const res = await fetch(`${BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include', // Important: include cookies
        });

        if (!res.ok) {
          return false;
        }

        return true;
      } catch (err) {
        console.error('Failed to silently refresh token:', err);
        return false;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  private async request<T>(
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'PUT',
    endpoint: string,
    data?: unknown,
    isRetry = false
  ): Promise<{ data: T | null; error: string | null }> {
    const url = `${BASE_URL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const config: RequestInit = {
      method,
      headers,
      credentials: 'include', // Important: include cookies in all requests
    };

    if (data !== undefined) {
      config.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, config);

      // Automatically attempt silent refresh on 401 Unauthorized
      if (
        response.status === 401 &&
        !isRetry &&
        !endpoint.includes('/auth/login') &&
        !endpoint.includes('/auth/refresh')
      ) {
        const refreshed = await this.refreshAccessToken();
        if (refreshed) {
          return this.request<T>(method, endpoint, data, true);
        }
      }

      let responseData: unknown = null;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
      }

      if (!response.ok) {
        let errorMsg = 'Request failed';
        if (responseData && typeof responseData === 'object') {
          const data = responseData as Record<string, unknown>;
          errorMsg = (data.message || data.error) as string;
          if (data.error && data.message && data.error !== data.message) {
            errorMsg = `${data.error}: ${data.message}`;
          }
        }
        if (!errorMsg) {
          errorMsg = `Request failed with status ${response.status}`;
        }
        return { data: null, error: errorMsg };
      }

      return { data: responseData as T, error: null };
    } catch (error: unknown) {
      console.error(`API connection error for ${url}:`, error);
      let errorMsg = error instanceof Error ? error.message : 'Network error occurred';
      const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';

      if (isHttps && url.startsWith('http://localhost')) {
        errorMsg = 'Frontend is deployed on HTTPS, but NEXT_PUBLIC_API_URL is pointing to localhost. Please configure NEXT_PUBLIC_API_URL in your Vercel Project Settings and redeploy.';
      } else if (errorMsg === 'Failed to fetch') {
        errorMsg = 'Failed to connect to backend server. The Render service may be waking up (cold start can take 50s), CORS is blocking, or the Render backend is inactive. Please check Render logs and retry.';
      }

      return {
        data: null,
        error: errorMsg,
      };
    }
  }

  async get<T>(endpoint: string) {
    return this.request<T>('GET', endpoint);
  }

  async post<T>(endpoint: string, data?: unknown) {
    return this.request<T>('POST', endpoint, data);
  }

  async patch<T>(endpoint: string, data?: unknown) {
    return this.request<T>('PATCH', endpoint, data);
  }

  async put<T>(endpoint: string, data?: unknown) {
    return this.request<T>('PUT', endpoint, data);
  }

  async delete<T>(endpoint: string) {
    return this.request<T>('DELETE', endpoint);
  }

  async upload<T>(endpoint: string, formData: FormData, headers?: Record<string, string>) {
    const url = `${BASE_URL}${endpoint}`;
    const requestHeaders: Record<string, string> = {};

    // Merge custom headers (but don't set Content-Type for FormData)
    if (headers) {
      Object.keys(headers).forEach(key => {
        if (key.toLowerCase() !== 'content-type') {
          requestHeaders[key] = headers[key];
        }
      });
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: requestHeaders,
        body: formData,
        credentials: 'include', // Important: include cookies
      });

      // Handle 401 Unauthorized
      if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh')) {
        const refreshed = await this.refreshAccessToken();
        if (refreshed) {
          const retryResponse = await fetch(url, {
            method: 'POST',
            headers: requestHeaders,
            body: formData,
            credentials: 'include',
          });

          if (!retryResponse.ok) {
            const errorData = await retryResponse.json();
            return { data: null, error: errorData?.message || errorData?.error || 'Upload failed' };
          }

          const data = await retryResponse.json();
          return { data: data as T, error: null };
        }
      }

      if (!response.ok) {
        const errorData = await response.json();
        return { data: null, error: errorData?.message || errorData?.error || 'Upload failed' };
      }

      const data = await response.json();
      return { data: data as T, error: null };
    } catch (error: unknown) {
      console.error(`File upload error for ${url}:`, error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Network error occurred during upload',
      };
    }
  }
}

export const apiClient = new ApiClient();