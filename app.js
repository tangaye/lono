// A. a place to store chat messages
const messages = [];

// B. way to add new chat messages
const addMessage = (sender, message) => {

    // C. assign a sender to a message 
    messages.push({sender: sender, message: message});
    
}

// D. Way to display the sender and the chat message
const displayMessage = () => {

    const message = `
        <div class="first-sender__message">
            <p class="message">${messages[0].message}</p>
            <p class="sender">${messages[0].sender}</p>
        </div>
    `;

    // F. way to display chat message above chat box field
    document.getElementById('messages').insertAdjacentHTML('beforeend', message);
}