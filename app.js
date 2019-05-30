const pageEl = {
	messageInputEl: document.querySelector("#message"),
	messengerEl: document.querySelector(".messenger"),
	conversationEl: document.querySelector(".conversation"),
	container: document.querySelector("#container"),
	searchBox: document.querySelector(".search-box")
};

const chatModel = {
	messages: [],

	messenger: "",

	addMessage(message) {
		this.messages.push(message);
	},

	setMessenger(messenger) {
		this.messenger = messenger;
	},

	getMessenger() {
		return this.messenger;
	}
};

const chatController = {
	sendMessage(message) {
		const newMessage = {
			messenger: chatModel.getMessenger(),
			message: message,
			date: new Date()
		};

		// add message
		chatModel.addMessage(newMessage);

		// display message
		this.displayMessage(newMessage);

		// clear message input
		chatView.clearMessageInput();

		// keep page scroll at the bottom
		updateScroll();
	},

	displayMessage(message) {
		chatView.displayMessage(message);
	},

	setChatMessenger(messenger) {
		chatModel.setMessenger(messenger);
	},

	search(needle) {
		// Get an iterable NodeList of all chat messages(message-block)
		const messageBlocks = document.querySelectorAll(".message-block");

		// loop through messageBlocks
		messageBlocks.forEach(haystack => {
			// A user message sits in a <p> which sits in a <div>
			let haystackText = haystack.firstElementChild.firstElementChild.textContent.toUpperCase();

			// if needle found in haystack display message otherwise hide it
			haystackText.indexOf(needle) !== -1 ?
				(haystack.style.display = "flex") :
				(haystack.style.display = "none");
		});
	}
};

const chatView = {
	displayMessage(message) {
		const date = message.date;
		const dateString = `${date.toDateString()} • ${date.toLocaleTimeString()}`;

		const messageBlock = `
            <li class="${this.getMessenger()} message-block">
                <div class="messages">
                    <p class="message">${message.message}</p>
                    <span class="sender">${message.messenger}</span>
                    <time>${dateString}</time>
                </div>
            </li>
        `;

		pageEl.conversationEl.insertAdjacentHTML("beforeend", messageBlock);
	},

	getMessengerName() {

		// If messengerEl is checked sender messenger name is 'Blama Doe' otherwise 'Konah Doe'
		return pageEl.messengerEl.checked ? "Blama Doe" : "Konah Doe";
	},

	getMessenger() {

		// If messengerEl is checked return 'sender' otherwise receipient
		return pageEl.messengerEl.checked ? "sender" : "receipient";
	},

	clearMessageInput() {
		pageEl.messageInputEl.value = null;
	},

	setupEventListeners() {
		// Event listener for search box
		pageEl.searchBox.addEventListener("keyup", event => {
			let searchChar = event.target.value.toUpperCase();

			chatController.search(searchChar);
		});

		// Event listener for message input
		pageEl.messageInputEl.addEventListener("keydown", event => {
			const message = event.target.value;
			let messenger = this.getMessenger();

			if (event.code !== "Enter") return; // Do nothing when user doesn't press enter to send message
			if (message.length === 0) return; // Do nothing when message input is empty
			if (messenger === "") return; // Do nothing when messenger is not selected

			// otherwise set messenger and  send message
			chatController.setChatMessenger(this.getMessengerName());
			chatController.sendMessage(message);
		});
	}
};

chatView.setupEventListeners();

const updateScroll = () => (container.scrollTop = container.scrollHeight);