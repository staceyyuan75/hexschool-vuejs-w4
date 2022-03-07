import { createApp } from "https://cdnjs.cloudflare.com/ajax/libs/vue/3.2.29/vue.esm-browser.min.js";

let productModal = null;
let delProductModal = null;

// 分頁元件
const pagination = {
  props: ["pages"],
  template: "#pagination",
  methods: {
    emitPages(index) {
      this.$emit("emit-pages", index);
    }
  }
};

// 新增/編輯 產品 Modal 元件
const productComponent = {
  props: ["product", "isNew", "isValid"],
  template: "#productModal",
  methods: {
    getProducts(index = 1) {
      this.$emit("update", index);
    },
    updateProduct() {
      this.$emit("update-product", this.product);
    },
    createImages() {
      this.product.imagesUrl = [];
      this.product.imagesUrl.push("");
    },
    delImages(index) {
      // 刪除圖片
      this.product.imagesUrl.splice(index, 1);
    },
    uploadImage(event) {
      // 抓取 input file 檔案
      let inputId = event.target.id;
      let index = inputId.substring(8);
      const uploadedFile = event.target.files[0];
      const formData = new FormData();
      formData.append("image", uploadedFile);

      // 串接 API 上傳圖檔
      let apiUrl = "https://vue3-course-api.hexschool.io/v2";
      let apiPath = "staceyyuan-hexschool";
      let url = apiUrl + "/api/" + apiPath + "/admin/upload";
      axios
        .post(url, formData, {
          headers: {
            "Content-Type": "multipart/form-data"
          }
        })
        .then(res => {
          if (res.data.success) {
            this.product.imagesUrl[index] = res.data.imageUrl;
          }
        })
        .catch(error => {
          console.log(error.data);
        });
    }
  },
  mounted() {
    productModal = new bootstrap.Modal(
      document.getElementById("productModal"),
      {
        keyboard: false
      }
    );
  }
};

// 刪除產品 Modal 元件
const delProductComponent = {
  props: ["item"],
  template: "#delProductModal",
  methods: {
    getProducts(index = 1) {
      this.$emit("update", index);
    },
    delProduct() {
      this.$emit("delete-product", this.item);
    }
  },
  mounted() {
    delProductModal = new bootstrap.Modal(
      document.getElementById("delProductModal"),
      {
        keyboard: false
      }
    );
  }
};

createApp({
  data() {
    return {
      apiUrl: "https://vue3-course-api.hexschool.io/v2",
      apiPath: "staceyyuan-hexschool",
      products: [],
      tempProduct: {},
      isValid: {
        title: true,
        category: true,
        unit: true,
        origin_price: true,
        price: true
      },
      isNew: false,
      isConfirm: false,
      pagination: {}
    };
  },
  components: {
    pagination,
    productComponent,
    delProductComponent
  },
  methods: {
    checkAdmin() {
      // 取得 Token
      const token = this.getToken();

      // token 寫入 header
      axios.defaults.headers.common["Authorization"] = token;

      // 確認是否登入
      axios
        .post(`${this.apiUrl}/api/user/check`)
        .then(res => {
          this.getProducts();
        })
        .catch(error => {
          let isSuccess = error.data.success;
          let message = error.data.message;
          if (!isSuccess) {
            const swalWithBootstrapButtons = Swal.mixin({
              customClass: {
                confirmButton: "btn btn-success"
              },
              buttonsStyling: false
            });
            swalWithBootstrapButtons
              .fire({
                title: "發生錯誤",
                text: message,
                icon: "warning",
                confirmButtonText: "登入",
                reverseButtons: true
              })
              .then(result => {
                if (result.isConfirmed) {
                  window.location.href = "./index.html";
                }
              });
          }
        });
    },
    getToken() {
      const token = document.cookie.replace(
        /(?:(?:^|.*;\s*)hexToken\s*\=\s*([^;]*).*$)|^.*$/,
        "$1"
      );
      return token;
    },
    getProducts(index = 1) {
      // 取得後台產品列表
      axios
        .get(`${this.apiUrl}/api/${this.apiPath}/admin/products`, {
          params: {
            page: index
          }
        })
        .then(res => {
          this.products = res.data.products;
          this.pagination = res.data.pagination;
        })
        .catch(error => {
          console.log(error.data);
        });
    },
    openModal(method, item) {
      if (method === "new") {
        this.tempProduct = {
          imagesUrl: []
        };
        this.isNew = true;
        productModal.show();
      } else if (method === "edit") {
        this.tempProduct = { ...item };
        this.isNew = false;
        productModal.show();
      } else if (method === "delete") {
        this.tempProduct = { ...item };
        delProductModal.show();
      }
    },
    showSuccessAlert() {
      Swal.fire({
        title: "更新完成",
        icon: "success",
        confirmButtonColor: "#0d6efd",
        confirmButtonText: "確定"
      });
    },
    updateProduct(product) {
      // 先確認必要欄位是否有資料
      let invalidCount = this.beforeSubmit();

      if (invalidCount == 0) {
        // 新增產品 API
        let url = `${this.apiUrl}/api/${this.apiPath}/admin/product`;
        let http = "post";

        if (!this.isNew) {
          // 編輯產品 API
          let productId = product.id;
          url = `${this.apiUrl}/api/${this.apiPath}/admin/product/${product.id}`;
          http = "put";
        }

        axios[http](url, { data: product })
          .then(res => {
            this.isConfirm = false;
            productModal.hide();
            this.showSuccessAlert();
            this.getProducts();
          })
          .catch(error => {
            console.log(error.data);
          });
      }
    },
    delProduct(item) {
      // 刪除產品
      axios
        .delete(`${this.apiUrl}/api/${this.apiPath}/admin/product/${item.id}`, {
          id: item.id
        })
        .then(res => {
          delProductModal.hide();
          this.getProducts();
        })
        .catch(error => {
          console.log(error.data);
        });
    },
    beforeSubmit() {
      let tempIsValid = {};
      let validateInput = Object.keys(this.isValid);
      let invalidCount = 0;

      validateInput.forEach(function (index) {
        let inputValue = document.getElementById(index).value.trim();
        if (inputValue == "" || inputValue === undefined) {
          tempIsValid[index] = false;
          invalidCount++;
        } else {
          tempIsValid[index] = true;
        }
      });

      this.isValid = tempIsValid;
      if (invalidCount > 0) {
        this.isConfirm = false;
      } else {
        this.isConfirm = true;
      }

      return invalidCount;
    },
    resetStatus(data) {
      this.isValid = data.isValid;
    }
  },
  mounted() {
    // 先確認登入狀態
    this.checkAdmin();

    // 若是關閉視窗則回復設定
    let vm = this;
    let myModalEl = document.getElementById("productModal");
    myModalEl.addEventListener("hidden.bs.modal", function (event) {
      vm.resetStatus(vm.$options.data());
    });
  }
}).mount("#app");
