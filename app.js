const messageInputEl = document.getElementById('message');
const messengerEl = document.getElementById('messenger');
const conversationEl = document.querySelector('.conversation');

// A. a place to store chat messages
const messages = [];

// B. way to add new chat messages
const addMessage = (message) => {

    const messenger = messengerEl.value === 'sender' ? 'Blama Doe' : 'Konah Doe';

    const newMessage = {
        messenger: messenger, 
        message: message,
        date: new Date()
    };

    // C. assign a sender to a message 
    messages.push(newMessage);

    displayMessage(newMessage);

}

// D. Way to display the sender and the chat message
const displayMessage = (message) => {

    const date = message.date;
    const dateString = `${date.toDateString()} • ${date.toLocaleTimeString()}`;

    const messageBlock = `
        <li class="${messengerEl.value}">
            <div class="messages">
                <p class="message">${message.message}</p>
                <span class="sender">${message.messenger}</span>
                <time>${dateString}</time>
            </div>
        </li>
    `;

    // F. way to display chat message above chat box field
    conversationEl.insertAdjacentHTML('beforeend', messageBlock);
}


messageInputEl.addEventListener('keydown', (event) => {
    
    const message = messageInputEl.value;

    if (event.code !== 'Enter') return;
    if (message.length === 0) return;
    if (messengerEl.value === '') return;

    addMessage(message);

});

