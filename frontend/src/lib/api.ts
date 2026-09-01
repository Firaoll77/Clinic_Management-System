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

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

class ApiClient {
  private token: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('accessToken');
    }
  }

  setToken(token: string) {
    this.token = token;
  }

  clearToken() {
    this.token = null;
  }

  private async request<T>(
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'PUT',
    endpoint: string,
    data?: any
  ): Promise<{ data: T | null; error: string | null }> {
    const url = `${BASE_URL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const config: RequestInit = {
      method,
      headers,
    };

    if (data !== undefined) {
      config.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, config);

      let responseData: any = null;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
      }

      if (!response.ok) {
        const errorMsg = responseData?.error || responseData?.message || `Request failed with status ${response.status}`;
        return { data: null, error: errorMsg };
      }

      return { data: responseData as T, error: null };
    } catch (error: any) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Network error occurred',
      };
    }
  }

  async get<T>(endpoint: string) {
    return this.request<T>('GET', endpoint);
  }

  async post<T>(endpoint: string, data?: any) {
    return this.request<T>('POST', endpoint, data);
  }

  async patch<T>(endpoint: string, data?: any) {
    return this.request<T>('PATCH', endpoint, data);
  }

  async put<T>(endpoint: string, data?: any) {
    return this.request<T>('PUT', endpoint, data);
  }

  async delete<T>(endpoint: string) {
    return this.request<T>('DELETE', endpoint);
  }
}

export const apiClient = new ApiClient();