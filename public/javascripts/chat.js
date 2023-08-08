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
              listItem.innerHTML = `<a href="/chat/${contact.student_id}">${contact.student_id}</a>`;
              contactsList.appendChild(listItem);
            });
          })
          .catch(error => {
            console.error('Error fetching contacts:', error);
          });
      }

    window.onload = function () {
        fetchContacts();
    };