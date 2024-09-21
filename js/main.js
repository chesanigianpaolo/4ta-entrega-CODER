//ACLARACION: oriento el proyecto a un ecommerce, porque en el curso de Desarrollo web, hice un sitio de carteras, para el negocio de mi pareja.
//La idea es seguir optimizando eso y hacerlo funcionar, por lo que, todo el desarrollo aqui contenido, lo puedo llevar a aquel proyecto! 
//GRACIAS profe!! Fue un excelente guía en toda la cursada, este camino para mi recién comienza, y espero volverlo a ver como colega!

// (12 productos, ver en product.json)
const products = [];

// Función para obtener productos de una API
async function fetchProducts() {
    try {
        const response = await fetch('products.json'); // Cambia la URL si es necesario
        if (!response.ok) {
            throw new Error('Error al cargar los productos');
        }
        const products = await response.json();
        return products;
    } catch (error) {
        console.error('Error:', error);
        return []; // Retorna un array vacío en caso de error
    }
}

// Función para generar las cards de productos
async function generateProductCards() {
    const productList = document.getElementById('product-list');
    productList.innerHTML = ''; // Limpiar contenido actual

    const products = await fetchProducts(); // Espera a que se obtengan los productos

    products.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';

        card.innerHTML = `
            <h3>${product.name}</h3>
            <p>${product.description}</p>
            <p>$${product.price.toFixed(2)}</p>
            <div class="quantity-controls">
                <button class="quantity-decrease">-</button>
                <input type="number" class="quantity" value="0" min="0" readonly>
                <button class="quantity-increase">+</button>
            </div>
            <button class="add-to-cart">Agregar al carrito</button>
        `;
        card.querySelector('.quantity-increase').addEventListener('click', () => updateQuantity(card, 1));
        card.querySelector('.quantity-decrease').addEventListener('click', () => updateQuantity(card, -1));
        card.querySelector('.add-to-cart').addEventListener('click', () => addToCart(product, card));
        productList.appendChild(card);
    });
}

// Actualizar la cantidad en la card
function updateQuantity(card, change) {
    const quantityInput = card.querySelector('.quantity');
    let quantity = parseInt(quantityInput.value, 10) + change;
    quantity = Math.max(quantity, 0);
    quantityInput.value = quantity;
}

// Agregar producto al carrito
function addToCart(product, card) {
    const quantity = parseInt(card.querySelector('.quantity').value, 10);
    if (quantity > 0) {
        let cart = JSON.parse(localStorage.getItem('cart')) || [];
        const itemIndex = cart.findIndex(item => item.id === product.id);

        if (itemIndex >= 0) {
            cart[itemIndex].quantity += quantity;
        } else {
            cart.push({ ...product, quantity });
        }

        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartDisplay();

        // Mostrar toast de éxito
        Toastify({
            text: `${quantity} ${product.name}(s) agregado(s) al carrito.`,
            duration: 3000,
            gravity: "top",
            position: "right",
            style: {
                background: "linear-gradient(to right, #00b09b, #96c93d)",
            },
        }).showToast();
    } else {
        // Mostrar toast de error
        Toastify({
            text: "No se puede agregar un producto con cantidad cero.",
            duration: 3000,
            gravity: "top",
            position: "right",
            style: {
                background: "linear-gradient(to right, #ff5f6d, #ffc371)",
            },
        }).showToast();
    }
}

// Actualizar la visualización del carrito
function updateCartDisplay() {
    const cartItems = JSON.parse(localStorage.getItem('cart')) || [];
    const cartContainer = document.getElementById('cart-items');
    cartContainer.innerHTML = '';

    let total = 0; // acumula el total

    cartItems.forEach(item => {
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        const itemTotal = item.price * item.quantity; // calcula el total del item
        total += itemTotal; // suma el total del item al total general
        cartItem.innerHTML = `
            <p>${item.name} 
                (x<input type="number" class="cart-quantity" value="${item.quantity}" min="0" data-id="${item.id}">) 
                - $${itemTotal.toFixed(2)}
                <button class="remove-item" data-id="${item.id}">Eliminar</button>
            </p>
        `;
        cartContainer.appendChild(cartItem);
    });

    // Actualiza las cantidades en tiempo real
    const quantityInputs = cartContainer.querySelectorAll('.cart-quantity');
    quantityInputs.forEach(input => {
        input.addEventListener('change', (e) => {
            const id = parseInt(e.target.dataset.id);
            const newQuantity = parseInt(e.target.value);
            updateCartItemQuantity(id, newQuantity);
        });
    });

    // Eliminar producto del carrito
    const removeButtons = cartContainer.querySelectorAll('.remove-item');
    removeButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const id = parseInt(e.target.dataset.id);
            removeFromCart(id);
        });
    });

    // Mostrar el total en el carrito
    const totalElement = document.createElement('div');
    totalElement.className = 'cart-total';
    totalElement.innerHTML = `<p>Total: $${total.toFixed(2)}</p>`;
    cartContainer.appendChild(totalElement);
}

// Actualizar la cantidad de un item en el carrito
function updateCartItemQuantity(id, newQuantity) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const itemIndex = cart.findIndex(item => item.id === id);

    if (itemIndex >= 0) {
        if (newQuantity > 0) {
            cart[itemIndex].quantity = newQuantity;
        } else {
            cart.splice(itemIndex, 1); // Eliminar del carrito si la cantidad es cero
        }
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartDisplay(); // Actualizar visualización del carrito
}

// Eliminar producto del carrito
function removeFromCart(id) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    cart = cart.filter(item => item.id !== id); // Filtrar el producto a eliminar
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartDisplay(); // Actualizar visualización del carrito
}

// Finalizar compra
function checkout() {
    const cartItems = JSON.parse(localStorage.getItem('cart')) || [];
    
    if (cartItems.length === 0) {
        Swal.fire({
            icon: "error",
            title: "Oops...",
            text: "Tu carrito aún está vacío!",
        });
        return;
    }
    
    // Solicitar datos del usuario
    Swal.fire({
        title: "Detalles de la compra",
        html: `
        <input id="name" class="swal2-input" placeholder="Nombre">
        <input id="address" class="swal2-input" placeholder="Dirección">
        <input id="card" class="swal2-input" placeholder="Número de tarjeta">
        <input id="expiry" class="swal2-input" placeholder="Fecha de Vencimiento (MM/AA)">
        <input id="cvv" class="swal2-input" placeholder="Código de Seguridad (CVV)">
    `,
    focusConfirm: false,
    preConfirm: () => {
        const name = document.getElementById('name').value;
        const address = document.getElementById('address').value;
        const card = document.getElementById('card').value;
        const expiry = document.getElementById('expiry').value;
        const cvv = document.getElementById('cvv').value;

        if (!name || !address || !card || !expiry || !cvv) {
            Swal.showValidationMessage(`Por favor completa todos los campos.`);
            return false;
        }

        return { name, address, card, expiry, cvv };
    }
}).then((result) => {
    if (result.isConfirmed) {
        // Aquí puedes manejar los datos del usuario como desees
        Swal.fire({
            title: "¡Compra exitosa!",
            text: "¡Gracias por su preferencia, que lo disfrutes!",
            icon: "success"
        });

        localStorage.removeItem('cart');
        updateCartDisplay();
        resetQuantities(); // Resetear las cantidades en las cards
        }
    });
}

// Resetear las cantidades en las cards
function resetQuantities() {
    const quantityInputs = document.querySelectorAll('.product-card .quantity');
    quantityInputs.forEach(input => {
        input.value = 0;
    });
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    generateProductCards(); // Llama a la función para generar productos
    updateCartDisplay();

    let timerInterval;
    Swal.fire({
        title: "Bienvenido a UrbanFood",
        html: "Gracias por elegirnos.",
        timer: 1650,
        timerProgressBar: true,
        didOpen: () => {
            Swal.showLoading();
            const timer = Swal.getPopup().querySelector("b");
            timerInterval = setInterval(() => {
                timer.textContent = `${Swal.getTimerLeft()}`;
            }, 100);
        },
        willClose: () => {
            clearInterval(timerInterval);
        }
    }).then((result) => {
        if (result.dismiss === Swal.DismissReason.timer) {
            console.log("I was closed by the timer");
        }
    });

    document.getElementById('checkout-btn').addEventListener('click', checkout);
});
