// Add a listener for communication with the admin page
window.addEventListener('message', function (event) {
  var xhr;

  // The admin page will send two types of actions apply and restoreDefaults
  switch (event.data.action) {
  case 'apply':
    // Get the client_id and client_secret set by the user
    var newClientId = document.querySelector('input[name=client_id]').value;
    var newClientSecret = document.querySelector('input[name=client_secret]').value;

    if (!newClientId || !newClientSecret) {
      event.source.postMessage({done: false, message: 'Both fields are mandatory.'}, event.origin);
      return;
    }

    // Send them to the config servlet
    xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
      // Let the admin page know the result
      // Make sure to set the targetOrigin to event.origin otherwise the admin page will ignore the message
      if (xhr.readyState == 4 && xhr.status == 200) {
        event.source.postMessage({done: true, message: 'New credentials set successfuly.'}, event.origin);
      } else if (xhr.readyState == 4) {
        event.source.postMessage({done: false, message: 'Failed to set new credentials.'}, event.origin);
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
        var response = JSON.parse(xhr.responseText);
        var clientId = response.client_id;
        var clientSecret = response.client_secret;

        event.source.postMessage({done: true, message: 'Credentials reset succesfully.', data: {
          clientId: clientId,
          clientSecret: clientSecret
        }}, event.origin);
      } else if (xhr.readyState == 4) {
        event.source.postMessage({done: false, message: 'Failed to reset credentials.'}, event.origin);
      }
    };
    xhr.open('DELETE', '../plugins-dispatcher/github-config');
    xhr.send('');
    break;
  }
});