    function fetchContacts() {
        fetch('/api/contacts')
          .then(response => response.json())
          .then(data => {
            const contactsList = document.getElementById('contacts-list');
    
            // Clear the current contacts list
            // contactsList.innerHTML = '';
    
            // Loop through the contacts and create list items for each contact
            data.forEach(contact => {
              const listItem = document.createElement('div');
              listItem.classList.add('row', 'col-10')
              let profileImage = document.createElement('img');
              profileImage.classList.add('profile-circle-img');
              profileImage.src = '/images/' + contact.student_id + '.jpg';
              let column = document.createElement('div');
              column.classList.add('col-3');
              column.appendChild(profileImage);
              col2 = document.createElement('div');
              col2.innerHTML = contact.student_id;
              col2.classList.add('col-9');
              listItem.appendChild(column);
              listItem.appendChild(col2);
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