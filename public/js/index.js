const client = io(); // Initialize socket.
const OFFLINE = 'offline';
const ONLINE = 'online';
const IDLE = 'idle';
const SENT = 'sent';
const DELIVERED = 'delivered';
const READ = 'read';

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

    setUsername(user) {
        sessionStorage.setItem('user', JSON.stringify(user));
    },

    getUsername() {
        return JSON.parse(sessionStorage.getItem('user'));
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

    setupUser(user, users, messages) {

        this.setChatUsername(user);

        this.connectedUsers(users);

        this.sentMessages(messages);

        showLoggedInUser(user.name);

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

        this.connectedUsers(users);

        this.availableUsersCount(users.length);

        this.sentMessages(messages);

    },

    connectedUsers(users) {
        chatView.displayConnectedUsers(users);
    },

    // Show the number of users online - the user viewing
    availableUsersCount(count) {
        chatView.displayAvailableUsersCount(count - 1);
    },

    sentMessages(messages) {
        chatView.displaySentMessages(messages);
    },

    sendMessageToSocket(message) {

        client.emit('send message', message);
    },

    showConnectedUsers(users) {

        this.connectedUsers(users);
        this.availableUsersCount(users.length);
    },

    login(username) {

        client.emit('login', username, data => {

            if (data.error) {

                this.userNameError(data.error);

            } else {

                // hide login page and show chat page
                chatView.hideLoginPage();
                chatView.showChatPage();
            }
        });

    },

    userNameError(error) {
        chatView.displayUsernameError(error);
    },

    userReconnect(user, users, messages) {

        showLoggedInUser(user.name);

        this.setChatUsername(user);

        // hide login page and show chat page
        chatView.hideLoginPage();
        chatView.showChatPage();

        this.connectedUsers(users);
        this.availableUsersCount(users.length);
        this.sentMessages(messages);
    },

    updateUserStatus(user) {
        chatView.displayUserStatus(user);
    },

    requestMessageStatusUpdate(message, status) {
        client.emit('update message', message, status);
    },

    updateMessage(message) {
        chatView.updateMessage(message);
    },

    nameExistsError(message) {
        chatView.displayUsernameError(message);
    }
};

const chatView = {

    messageBlock(message) {

        let user = chatController.getChatUsername();

        if (user) {

            return `
                <li id='message-${message.id}' class='message-block'>
                    <article class="message">
                        <header class="sender">${user.name === message.sender ? 'you' : message.sender}</header>
                        <p>${message.content}</p>
                    </article>
                    <div class="message-status">
                        <time class="time">${moment(message.date).format("h:mma")}</time>
                        <span class="status">${user.name === message.sender ? message.status : ''}</span>
                    </div>
                </li>
            `;
        }

    },

    displayMessage(message) {

        pageEl.conversationEl.insertAdjacentHTML("beforeend", this.messageBlock(message));
    },

    updateMessage(message) {

        let user = chatController.getChatUsername();

        if (message && user) {

            let messageEl = document.querySelector(`#message-${message.id}`);

            // Show message status only to sender
            if (user.name === message.sender) {
                messageEl.lastElementChild.lastElementChild.innerHTML = message.status;
            }

        }

    },

    displayLoginUserMessages(user, messages) {

    },

    displaySentMessages(messages) {

        pageEl.conversationEl.innerHTML = '';
        let user = chatController.getChatUsername();

        if (user) {
            messages.forEach(message => {

                // If sender is not the one refreshing, update message status
                if (message.status !== READ && message.sender !== user.name) chatController.requestMessageStatusUpdate(message, READ);

                pageEl.conversationEl.insertAdjacentHTML("beforeend", this.messageBlock(message));

            });
        }

    },

    clearMessageInput() {
        pageEl.messageInputEl.value = '';
    },

    displayConnectedUsers(users) {

        pageEl.usersList.innerHTML = '';

        users.forEach(user => {

            let chatUser = chatController.getChatUsername();

            if (chatUser && user.name !== chatUser.name) {

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

            }

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

    displayUsernameError(message) {

        let errorEl = document.querySelector('.username-error');

        errorEl.style.display = 'flex';

        errorEl.innerHTML = message;

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

                    sender: chatController.getChatUsername().name,
                    content: value,
                    date: new Date(),
                    id: String(Date.now() + Math.floor(Math.random())),
                    status: SENT
                };

                chatController.addUserMessage(message);

            }

        });

        document.addEventListener('change', event => {

            if (event.target.classList.contains('user-status')) {

                let status = event.target.value;

                client.emit('update status', status);

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

client.on('connected', (user, users, messages) => chatController.userReconnect(user, users, messages));

client.on('logged in', (username, users, messages) => chatController.userLoggedIn(username, users, messages));

client.on('disconnected', users => chatController.showConnectedUsers(users));

client.on('status updated', user => chatController.updateUserStatus(user));

client.on('updated message', message => chatController.updateMessage(message));

client.on('user reconnected', users => chatController.connectedUsers(users));

client.on('user details', (user, users, messages) => chatController.setupUser(user, users, messages));

client.on('broadcast message', (sender, message) => {

    if (message === undefined) return;

    let user = chatController.getChatUsername();

    if (user) {

        // if not sender
        if (sender.sessionId !== user.sessionId) {

            // If receiver page is not active
            if (document.hidden) {

                chatController.requestMessageStatusUpdate(message, DELIVERED);
                notifyUser(`${message.sender} says: ${message.content}`);
            }

            document.addEventListener('visibilitychange', () => {

                // If reciever page gets active
                if (!document.hidden && user.name !== message.name) {
                    chatController.requestMessageStatusUpdate(message, READ);
                }

            });

        }

    }

    chatController.broadcastMessage(message);

});

const notifyUser = message => {

    // Check if there's browser support
    if (!window.Notification) {
        console.log('Your browser does not support notifications');
    } else {

        // Check if permission has been granted
        if (Notification.permission === 'granted') {

            // show notificaton 
            let notify = new Notification('Lono', {
                body: message,
                icon: '/images/logo.png'
            });

        } else {

            // Request permission from user
            Notification.requestPermission()
                .then(permission => {

                    if (permission === 'granted') {

                        // Show notification
                        let notify = new Notification('Lono', {
                            body: message,
                            icon: '/images/logo.png'
                        });
                    }
                }).catch(error => console.log(error));
        }
    }
}

const showLoggedInUser = username => {

    let userNameDiv = document.querySelector('.username');
    userNameDiv.innerHTML = username;
}