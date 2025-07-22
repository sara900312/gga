/**
 * نسخة Vanilla JavaScript لتعيين الطلبات للمتاجر
 * تستخدم Supabase Edge Function مع fetch API
 */

class OrderAssignment {
  constructor() {
    // إعدادات Supabase - يجب استبدالها بالقيم الفعلية
    this.supabaseUrl =
      process.env.REACT_APP_SUPABASE_URL || "your-supabase-url";
    this.supabaseKey =
      process.env.REACT_APP_SUPABASE_ANON_KEY || "your-supabase-anon-key";

    // حالة التطبيق
    this.isLoading = false;
    this.accessToken = null;

    // عناصر DOM
    this.elements = {};

    // ربط الدوال بـ this
    this.assignOrder = this.assignOrder.bind(this);
    this.showLoading = this.showLoading.bind(this);
    this.hideLoading = this.hideLoading.bind(this);
    this.showMessage = this.showMessage.bind(this);
  }

  /**
   * تهيئة المكون وربط الأحداث
   */
  init() {
    this.bindElements();
    this.bindEvents();
    this.loadAccessToken();
    console.log("✅ OrderAssignment initialized");
  }

  /**
   * ربط عناصر DOM
   */
  bindElements() {
    this.elements = {
      orderIdInput: document.getElementById("orderId"),
      storeIdInput: document.getElementById("storeId"),
      assignButton: document.getElementById("assignButton"),
      loadingDiv: document.getElementById("loading"),
      messageDiv: document.getElementById("message"),
      orderSelect: document.getElementById("orderSelect"),
      storeSelect: document.getElementById("storeSelect"),
    };
  }

  /**
   * ربط الأحداث
   */
  bindEvents() {
    if (this.elements.assignButton) {
      this.elements.assignButton.addEventListener(
        "click",
        this.handleAssignClick.bind(this),
      );
    }
  }

  /**
   * تحميل Access Token من localStorage أو Supabase
   */
  async loadAccessToken() {
    try {
      // محاولة الحصول على الـ token من localStorage أولاً
      const stored = localStorage.getItem("supabase.auth.token");
      if (stored) {
        const tokenData = JSON.parse(stored);
        this.accessToken = tokenData.access_token;
        console.log("✅ Token loaded from localStorage");
        return;
      }

      // إذا لم يوجد، محاولة الحصول عليه من Supabase
      const response = await fetch(
        `${this.supabaseUrl}/auth/v1/token?grant_type=password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: this.supabaseKey,
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        this.accessToken = data.access_token;
        console.log("✅ Token loaded from Supabase");
      } else {
        console.warn("⚠️ Could not load access token");
      }
    } catch (error) {
      console.error("❌ Error loading access token:", error);
    }
  }

  /**
   * معالج النقر على زر التعيين
   */
  async handleAssignClick() {
    const orderId =
      this.elements.orderIdInput?.value?.trim() ||
      this.elements.orderSelect?.value;
    const storeId =
      this.elements.storeIdInput?.value?.trim() ||
      this.elements.storeSelect?.value;

    if (!orderId || !storeId) {
      this.showMessage("يرجى إدخال معرف الطلب ومعرف المتجر", "error");
      return;
    }

    await this.assignOrder(orderId, storeId);
  }

  /**
   * الدالة الرئيسية لتعيين الطلب
   * @param {string} orderId - معرف الطلب
   * @param {string} storeId - معرف المتجر
   * @returns {Promise<Object>} - نتيجة العملية
   */
  async assignOrder(orderId, storeId) {
    console.log("🔄 بدء تعيين الطلب:", { orderId, storeId });

    // التحقق من صحة المدخلات
    if (!orderId || !storeId) {
      const errorMsg = "معرف الطلب ومعرف المتجر مطلوبان";
      this.showMessage(errorMsg, "error");
      return { success: false, error: errorMsg };
    }

    // التحقق من وجود Access Token
    if (!this.accessToken) {
      const errorMsg = "لا يوجد توكن صالح - يجب تسجيل الدخول أولاً";
      this.showMessage(errorMsg, "error");
      return { success: false, error: errorMsg };
    }

    this.showLoading();

    try {
      // إعداد الطلب
      const requestBody = {
        orderId: orderId,
        storeId: storeId,
      };

      const requestOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.accessToken}`,
          apikey: this.supabaseKey,
        },
        body: JSON.stringify(requestBody),
      };

      console.log("📤 إرسال الطلب:", {
        url: `${this.supabaseUrl}/functions/v1/assign-order`,
        body: requestBody,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.accessToken.slice(0, 20)}...`,
          apikey: `${this.supabaseKey.slice(0, 20)}...`,
        },
      });

      // إرسال الطلب
      const response = await fetch(
        `${this.supabaseUrl}/functions/v1/assign-order`,
        requestOptions,
      );

      console.log("📨 حالة الاستجابة:", response.status, response.statusText);

      // التحقق من حالة HTTP
      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ HTTP Error:", response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // تحليل الاستجابة
      const data = await response.json();
      console.log("📦 بيانات الاستجابة:", data);

      // التحقق من نجاح العملية
      if (data.success) {
        const successMsg = data.message || "تم تعيين الطلب ب��جاح";
        console.log("✅ تم تعيين الطلب بنجاح");

        this.showMessage(successMsg, "success");
        this.clearInputs();

        return {
          success: true,
          message: successMsg,
          data: data.data,
        };
      } else {
        const errorMsg = data.error || "فشل في تعيين الطلب";
        console.error("❌ فشل في تعيين الطلب:", errorMsg);
        throw new Error(errorMsg);
      }
    } catch (error) {
      const errorMessage = error.message || "حدث خطأ غير متوقع";
      console.error("❌ خطأ في assignOrder:", error);

      this.showMessage(`خطأ: ${errorMessage}`, "error");

      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      this.hideLoading();
    }
  }

  /**
   * عرض حالة التحميل
   */
  showLoading() {
    this.isLoading = true;

    if (this.elements.loadingDiv) {
      this.elements.loadingDiv.style.display = "block";
      this.elements.loadingDiv.innerHTML = `
        <div class="loading-spinner">
          <div class="spinner"></div>
          <span>جاري تعيين الطلب...</span>
        </div>
      `;
    }

    if (this.elements.assignButton) {
      this.elements.assignButton.disabled = true;
      this.elements.assignButton.innerHTML = `
        <span class="spinner-small"></span>
        جاري التعيين...
      `;
    }
  }

  /**
   * إخفاء حالة التحميل
   */
  hideLoading() {
    this.isLoading = false;

    if (this.elements.loadingDiv) {
      this.elements.loadingDiv.style.display = "none";
    }

    if (this.elements.assignButton) {
      this.elements.assignButton.disabled = false;
      this.elements.assignButton.innerHTML = "تعيين الطلب";
    }
  }

  /**
   * عرض رسالة للمستخدم
   * @param {string} message - نص الرسالة
   * @param {string} type - نوع الرسالة (success, error, info)
   */
  showMessage(message, type = "info") {
    if (!this.elements.messageDiv) return;

    const alertClass =
      {
        success: "alert-success",
        error: "alert-error",
        info: "alert-info",
      }[type] || "alert-info";

    const icon =
      {
        success: "✅",
        error: "❌",
        info: "ℹ️",
      }[type] || "ℹ️";

    this.elements.messageDiv.innerHTML = `
      <div class="alert ${alertClass}">
        <span class="alert-icon">${icon}</span>
        <span class="alert-message">${message}</span>
      </div>
    `;

    // إخفاء الرسالة بعد 5 ثواني
    setTimeout(() => {
      if (this.elements.messageDiv) {
        this.elements.messageDiv.innerHTML = "";
      }
    }, 5000);
  }

  /**
   * مسح المدخلات
   */
  clearInputs() {
    if (this.elements.orderIdInput) this.elements.orderIdInput.value = "";
    if (this.elements.storeIdInput) this.elements.storeIdInput.value = "";
    if (this.elements.orderSelect) this.elements.orderSelect.selectedIndex = 0;
    if (this.elements.storeSelect) this.elements.storeSelect.selectedIndex = 0;
  }

  /**
   * جلب قائمة الطلبات
   * @returns {Promise<Array>} - قائمة الطلبات
   */
  async fetchOrders() {
    try {
      const response = await fetch(
        `${this.supabaseUrl}/rest/v1/orders?select=id,customer_name,customer_phone,order_status&assigned_store_id=is.null&order=created_at.desc&limit=50`,
        {
          headers: {
            apikey: this.supabaseKey,
            Authorization: `Bearer ${this.accessToken}`,
          },
        },
      );

      if (response.ok) {
        const orders = await response.json();
        console.log("✅ Orders fetched:", orders.length);
        return orders;
      } else {
        console.error("❌ Failed to fetch orders:", response.status);
        return [];
      }
    } catch (error) {
      console.error("❌ Error fetching orders:", error);
      return [];
    }
  }

  /**
   * جلب قائمة المتاجر
   * @returns {Promise<Array>} - قائمة المتاجر
   */
  async fetchStores() {
    try {
      const response = await fetch(
        `${this.supabaseUrl}/rest/v1/stores?select=id,name&order=name`,
        {
          headers: {
            apikey: this.supabaseKey,
            Authorization: `Bearer ${this.accessToken}`,
          },
        },
      );

      if (response.ok) {
        const stores = await response.json();
        console.log("✅ Stores fetched:", stores.length);
        return stores;
      } else {
        console.error("❌ Failed to fetch stores:", response.status);
        return [];
      }
    } catch (error) {
      console.error("❌ Error fetching stores:", error);
      return [];
    }
  }

  /**
   * ملء القوائم المنسدلة بالبيانات
   */
  async populateDropdowns() {
    const [orders, stores] = await Promise.all([
      this.fetchOrders(),
      this.fetchStores(),
    ]);

    // ملء قائمة الطلبات
    if (this.elements.orderSelect && orders.length > 0) {
      this.elements.orderSelect.innerHTML =
        '<option value="">اختر طلب...</option>';
      orders.forEach((order) => {
        const option = document.createElement("option");
        option.value = order.id;
        option.textContent = `${order.customer_name} - ${order.customer_phone}`;
        this.elements.orderSelect.appendChild(option);
      });
    }

    // ملء قائمة المتاجر
    if (this.elements.storeSelect && stores.length > 0) {
      this.elements.storeSelect.innerHTML =
        '<option value="">اختر متجر...</option>';
      stores.forEach((store) => {
        const option = document.createElement("option");
        option.value = store.id;
        option.textContent = store.name;
        this.elements.storeSelect.appendChild(option);
      });
    }
  }
}

// تصدير الكلاس للاستخدام
if (typeof module !== "undefined" && module.exports) {
  module.exports = OrderAssignment;
}

// تهيئة تلقائية عند تحميل الصفحة
if (typeof window !== "undefined") {
  window.OrderAssignment = OrderAssignment;

  // تشغيل تلقائي عند تحميل DOM
  document.addEventListener("DOMContentLoaded", () => {
    window.orderAssignment = new OrderAssignment();
    window.orderAssignment.init();

    // ملء القوائم المنسدلة إذا كانت موجودة
    if (
      document.getElementById("orderSelect") ||
      document.getElementById("storeSelect")
    ) {
      window.orderAssignment.populateDropdowns();
    }
  });
}

/**
 * دالة مساعدة لتعيين طلب بسرعة
 * @param {string} orderId - معرف الطلب
 * @param {string} storeId - معرف المتجر
 * @returns {Promise<Object>} - نتيجة العملية
 */
window.quickAssignOrder = async (orderId, storeId) => {
  if (window.orderAssignment) {
    return await window.orderAssignment.assignOrder(orderId, storeId);
  } else {
    console.error("❌ OrderAssignment not initialized");
    return { success: false, error: "OrderAssignment not initialized" };
  }
};
