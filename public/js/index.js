const socket = io(); // Initialize socket.
const OFFLINE = 'offline';
const ONLINE = 'online';
const IDLE = 'idle';

const pageEl = {
    messageInputEl: document.querySelector(".chat-box"),
    conversationEl: document.querySelector(".conversation"),
    container: document.querySelector("#chat-area"),
    searchBox: document.querySelector(".search-box"),
    usersList: document.querySelector('.users'),
    usersCountEl: document.querySelector('.users-count')
};

const chatModel = {
    messages: [],

    addMessage(message) {
        this.messages.push(message);
    },

    setUsername(username) {
        sessionStorage.setItem('user', username);
    },

    getUsername() {
        return sessionStorage.getItem('user');
    }
};

const chatController = {

    broadcastMessage(message) {

        chatView.displayMessage(message);

        // keep page scroll at the bottom
        chatView.updateScroll();
    },

    // Adds user message and clears input
    addUserMessage(message) {

        // display user message to user
        chatView.displayMessage(message);

        // clear message input
        chatView.clearMessageInput();

        // keep page scroll at the bottom
        chatView.updateScroll();

        // broadcast user message
        this.sendMessageToSocket(message);
    },

    setChatUsername(username) {
        chatModel.setUsername(username);
    },


    getChatUsername() {
        return chatModel.getUsername();
    },

    search(needle) {
        // Get an iterable NodeList of all chat messages(message-block)
        const messageBlocks = document.querySelectorAll(".message-block");

        // loop through messageBlocks
        messageBlocks.forEach(haystack => {
            // A user message sits in a <p> which sits in a <div>
            let haystackText = haystack.firstElementChild.lastElementChild.textContent.toUpperCase();

            // if needle found in haystack display message otherwise hide it
            haystackText.indexOf(needle) !== -1 ?
                (haystack.style.display = "flex") :
                (haystack.style.display = "none");
        });
    },

    userLoggedIn(username, users, messages) {

        this.setChatUsername(username);

        this.connectedUsers(users);

        this.availableUsersCount(users.length);

        this.sentMessages(messages);

    },

    connectedUsers(users) {
        chatView.displayConnectedUsers(users);
    },

    availableUsersCount(count) {
        chatView.displayAvailableUsersCount(count);
    },

    sentMessages(messages) {
        chatView.displaySentMessages(messages);
    },

    sendMessageToSocket(message) {

        socket.emit('send message', message);
    },

    showConnectedUsers(users) {

        this.connectedUsers(users);
        this.availableUsersCount(users.length);
    },

    login(username) {
        socket.emit('login', username);
        // hide login page and show chat page
        chatView.hideLoginPage();
        chatView.showChatPage();
    },

    userReconnect(users, messages) {

        // hide login page and show chat page
        chatView.hideLoginPage();
        chatView.showChatPage();

        this.connectedUsers(users);
        this.availableUsersCount(users.length);
        this.sentMessages(messages);
    },

    updateUserStatus(user) {
        chatView.displayUserStatus(user);
    }
};

const chatView = {
    displayMessage(message) {
        const messageBlock = `

            <li class='message-block'>
                <article class="message">
                    <header class="sender">${message.sender}</header>
                    <p>${message.content}</p>
                </article>
                <time >${moment(message.date).format("h:mma")}</time>
            </li>

        `;

        pageEl.conversationEl.insertAdjacentHTML("beforeend", messageBlock);
    },

    displaySentMessages(messages) {

        pageEl.conversationEl.innerHTML = '';

        messages.forEach(message => {

            let messageBlock = `
                <li class='message-block'>
                    <article class="message">
                        <header class="sender">${message.sender}</header>
                        <p>${message.content}</p>
                    </article>
                    <time >${moment(message.date).format("h:mma")}</time>
                </li>`;

            pageEl.conversationEl.insertAdjacentHTML("beforeend", messageBlock);
        });

    },

    clearMessageInput() {
        pageEl.messageInputEl.value = '';
    },

    displayConnectedUsers(users) {
        pageEl.usersList.innerHTML = '';

        users.forEach(user => {

            let userLi = `
                <li id="user-${user.sessionId}">
                    <div class="user-details">
                        <span class="name">${user.name}</span>
                        <span class="last-seen">
                            ${user.status === OFFLINE ? 'last seen ' + moment(user.lastSeen).format("h:mma") : ''}
                        </span>
                    </div>
                    <span class="status ${user.status}"></span>
                </li>`;
            pageEl.usersList.insertAdjacentHTML('beforeend', userLi);
        });
    },

    displayAvailableUsersCount(count) {
        pageEl.usersCountEl.innerHTML = count;
    },

    hideLoginPage() {
        document.querySelector('#login-page').style.display = 'none';
    },

    showLoginPage() {
        document.querySelector('#login-page').style.display = 'flex';
    },

    showChatPage() {
        document.querySelector('#chat-page').style.display = 'flex';
    },

    displayUserStatus(user) {

        let userEl = document.querySelector(`#user-${user.sessionId}`);

        userEl.lastElementChild.classList = '';

        userEl.lastElementChild.classList.add('status', user.status);


        // THIS MAY NOT BE NEEEDED
        if (user.status === OFFLINE) {

            userEl.firstElementChild.lastElementChild.innerHTML = 'last seen ' + moment(Date.now()).format("h:mma");
        } else {

            userEl.firstElementChild.lastElementChild.innerHTML = '';
        }

    },

    updateScroll() {
        pageEl.container.scrollTop = pageEl.container.scrollHeight;
    },

    setupEventListeners() {

        document.addEventListener('keydown', event => {

            if (event.target.classList.contains('user-handle')) {

                if (event.code !== "Enter") return; // Do nothing when user doesn't press enter to send message

                const username = event.target.value;

                if (username.length === 0) return; // Do nothing when message input is empty

                // emit add user event
                chatController.login(username);
            }

            // Event listener for message input
            if (event.target.classList.contains('chat-box')) {

                if (event.code !== "Enter") return; // Do nothing when user doesn't press enter to send message

                const value = event.target.value;

                if (value.length === 0) return; // Do nothing when message input is empty

                const message = {

                    sender: chatController.getChatUsername(),
                    content: value,
                    date: new Date(),
                    id: String(Date.now() + Math.random()),
                    read: false
                };

                chatController.addUserMessage(message);

            }

        });

        document.addEventListener('change', event => {

            if (event.target.classList.contains('user-status')) {

                let status = event.target.value;

                socket.emit('update status', status);

            }

        });

        // Event listener for search box
        pageEl.searchBox.addEventListener('keyup', event => {
            let searchChar = event.target.value.toUpperCase();

            chatController.search(searchChar);
        });

    }
};

chatView.setupEventListeners();

socket.on('connected', (users, messages) => chatController.userReconnect(users, messages));

socket.on('broadcast message', message => chatController.broadcastMessage(message));

socket.on('logged in', (username, users, messages) => chatController.userLoggedIn(username, users, messages));

socket.on('disconnected', users => chatController.showConnectedUsers(users));

socket.on('status updated', user => chatController.updateUserStatus(user));