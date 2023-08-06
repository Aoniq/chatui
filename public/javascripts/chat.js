    function scrollToBottom() {
        let messageContainer = document.getElementById('chat-container');
        messageContainer.scrollTop = messageContainer.scrollHeight;
    }

    // Send message to server
    document.getElementById('send-button').addEventListener('click', function () {
        let message = document.getElementById('message-input').value;
        let data = {
            sender: document.getElementById('senderID').value,
            senderName: document.getElementById('senderName').value,
            message: message,
            receiver: document.getElementById('receiverID').value,
            receiver_socket_id: document.getElementById('receiverSocketID').value,
            sender_socket_id: document.getElementById('senderSocketID').value
        }
        socket.emit('chat message', data);
        document.getElementById('message-input').value = '';
    });

    // Receive message from server
    socket.on('chat message', function (msg) {
        let messageContainer = document.getElementById('chat-container');
        let messageElement = document.createElement('div');
        console.log(msg);

        messageElement.classList.add('message');

        if (msg.sender === document.getElementById('senderID').value) {
            messageElement.classList.add('sender');
        } else {
            messageElement.classList.add('receiver');
        }
        messageElement.innerHTML = `<strong>${msg.senderName}</strong> ${msg.message}`;
        messageContainer.appendChild(messageElement);
        scrollToBottom();
        });

        function fetchContacts() {
            fetch('/api/contacts')
              .then(response => response.json())
              .then(data => {
                const contactsList = document.getElementById('contacts-list');
        
                // Clear the current contacts list
                contactsList.innerHTML = '';
        
                // Loop through the contacts and create list items for each contact
                data.forEach(contact => {
                  const listItem = document.createElement('li');
                  listItem.innerHTML = `<a href="/chat/${contact.user_id}">${contact.username}</a>`;
                  contactsList.appendChild(listItem);
                });
              })
              .catch(error => {
                console.error('Error fetching contacts:', error);
              });
          }
    // Tell the server to create a private room for this sender-receiver pair

    window.onload = function () {
        fetchContacts();
        scrollToBottom();
    };