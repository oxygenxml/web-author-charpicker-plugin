// Add a listener for communication with the admin page
window.addEventListener('message', function (event) {
  var action = event.data.action;
  var origin = event.origin;
  
  var xhr;

  // The admin page will send two types of actions apply and restoreDefaults
  switch (action) {
  case 'apply':
    // Get the client_id and client_secret set by the user
    var newClientId = document.querySelector('input[name=client_id]').value;
    var newClientSecret = document.querySelector('input[name=client_secret]').value;

    if (!newClientId || !newClientSecret) {
      event.source.postMessage({done: false, message: 'Both fields are mandatory.'}, origin);
      return;
    }

    // Send them to the config servlet
    xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
      // Let the admin page know the result
      // Make sure to set the targetOrigin to origin otherwise the admin page will ignore the message
      if (xhr.readyState == 4 && xhr.status == 200) {
        event.source.postMessage({done: true, message: 'New credentials set successfuly.'}, origin);
      } else if (xhr.readyState == 4) {
        event.source.postMessage({done: false, message: 'Failed to set new credentials.'}, origin);
      }
    };
    xhr.open('PUT', '../plugins-dispatcher/github-config');
    xhr.send(JSON.stringify({
      client_id: newClientId,
      client_secret: newClientSecret
    }));
    break;
  case 'restoreDefaults':
    xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
      if (xhr.readyState == 4 && xhr.status == 200) {
        event.source.postMessage({done: true, message: 'Credentials reset succesfully.'}, origin);
      } else if (xhr.readyState == 4) {
        event.source.postMessage({done: false, message: 'Failed to reset credentials.'}, origin);
      }
    };
    xhr.open('DELETE', '../plugins-dispatcher/github-config');
    xhr.send('');
    break;
  }
});