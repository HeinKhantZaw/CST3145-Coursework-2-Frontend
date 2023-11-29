new Vue({
    el: "#app",
    data: {
        title: "Lessons",
        descriptions: "You can choose the lessons here:",
        lessons: [],
        cart: [],
        isProductPage: true,
        searchQuery: "",
        sortBy: "Subject",
        sortOrder: 1, // ascending
        name: "",
        phoneNumber: "",
        isNameValid: true,
        isNumberValid: true,
    },
    beforeMount() {
        this.fetchLessons();
    },
    methods: {
        fetchLessons: async function () {
            const response = await fetch("http://localhost:3000/api/lessons");
            this.lessons = await response.json();
        },
        fetchImages: async function () {
            const response = await fetch("http://localhost:3000/api/images");
        },
        addToCart: function (lesson) {
            if (lesson.Spaces > 0) {
                lesson.Spaces--;
                const lessonIndex = this.cart.findIndex(item => item.lesson === lesson);
                if (lessonIndex !== -1) {
                    this.cart[lessonIndex].amount++;
                } else {
                    this.cart.push({
                        lesson: lesson,
                        amount: 1
                    });
                }
            }
        },
        reduceFromCart: function (lesson) {
            lesson.Spaces++;
            const lessonIndex = this.cart.findIndex(item => item.lesson === lesson);
            if (lessonIndex !== -1) {
                this.cart[lessonIndex].amount--;
                if (this.cart[lessonIndex].amount <= 0) {
                    this.cart.splice(lessonIndex, 1);
                }
            }
        },
        removeFromCart: function (item) {
            item.lesson.Spaces += item.amount;
            const lessonIndex = this.cart.findIndex(cartItem => cartItem.lesson === item.lesson);
            if (lessonIndex !== -1) {
                this.cart.splice(lessonIndex, 1);
            }
        },
        toCartPage: function () {
            this.isProductPage = false;
        },
        submitOrder: async function () {
            const finalCart = this.cart.map(item => ({
                "_id": item.lesson._id,
                "Subject": item.lesson.Subject,
                "amount": item.amount
            }));
            const updatedLessons = this.cart.map(item => ({
                "_id": item.lesson._id,
                "Spaces": item.lesson.Spaces
            }));
            const order = {
                name: this.name,
                phoneNumber: this.phoneNumber,
                cart: finalCart
            };
            fetch("http://localhost:3000/api/order", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(order)
            }).then(async (res) => {
                    const result = await res.json();

                    if (result.acknowledged) {
                        updatedLessons.map(async (lesson) => {
                            await fetch(`http://localhost:3000/api/lessons/${lesson._id}`, {
                                method: "PUT",
                                headers: {
                                    "Content-Type": "application/json"
                                },
                                body: JSON.stringify(lesson)
                            });
                        })
                    }
                }
            );
        },
        backToHome:

            function (modalClose) {
                // reset everything when user goes back home
                this.isProductPage = true;
                this.isNameValid = true;
                this.isNumberValid = true;
                this.name = "";
                this.phoneNumber = "";
                if (modalClose === true) {
                    this.clearCheckoutForm();
                }
            }

        ,
        validateName: function () {
            const nameRegex = /^[A-Za-z\s]+$/; // only letters and spaces
            this.isNameValid = nameRegex.test(this.name)
        }
        ,
        validateNumber: function () {
            let phoneRegex = /^[0-9]+$/; // only numbers
            this.isNumberValid = phoneRegex.test(this.phoneNumber);
        }
        ,
        clearCheckoutForm: function () {
            this.cart = [];
            this.name = "";
            this.phoneNumber = "";
        }
    },
    computed: {
        cartItemCount: function () {
            return this.cart.length;
        },
        displayedLessons: function () {
            let result = this.lessons;
            if (this.searchQuery !== "")
                result = this.lessons.filter(lesson => {
                    return lesson.Subject.toLowerCase().includes(this.searchQuery.toLowerCase()) || lesson.Location.toLowerCase().includes(this.searchQuery.toLowerCase());
                });
            return result.sort((a, b) => {
                return this.sortOrder * (a[this.sortBy] > b[this.sortBy] ? 1 : -1); // ascending sort order
            })
        },
        isFormValid: function () {
            return this.name !== "" && this.isNameValid && this.phoneNumber !== "" && this.isNumberValid && this.cart.length > 0;
        },
        totalPrice: function () {
            return this.cart.reduce((total, item) => {
                return total + item.lesson.Price * item.amount;
            }, 0);
        }
    }
});
