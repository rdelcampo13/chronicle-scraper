// Grab the articles as a json
function updateSaves() {
  $.getJSON("/saves", function(dbEvents) {

    $('#eventslist').empty();

    // For each one    
    dbEvents.forEach(function(dbEvent) {
      var card = $('<div>')
          card.addClass('card');
      var cardBody = $('<div>')
          cardBody.addClass('card-body');
      var cardTitle = $('<h4>')
          cardTitle.addClass('card-title')
          cardTitle.text(dbEvent.title);
      var cardDateTime = $('<h6>')
          cardDateTime.addClass('card-subtitle mb-2 text-muted')
          cardDateTime.text("Date: " + dbEvent.dateTime);
      var cardVenue = $('<h6>')
          cardVenue.addClass('card-subtitle mb-2 text-muted')
          cardVenue.text("Venue: " + dbEvent.venue);
      var cardDescription = $('<p>')
          cardDescription.addClass('card-text')
          cardDescription.text(dbEvent.description);
      var cardLink = $('<a>')
          cardLink.addClass('btn btn-primary event-button')
          cardLink.text('Link')
          cardLink.attr('href', dbEvent.link);
      var cardNoteButton = $('<a>')
          cardNoteButton.addClass('btn btn-primary event-button note-button')
          cardNoteButton.text('Add a Note')
          cardNoteButton.data('event-id', dbEvent._id);
      var cardDeleteButton = $('<a>')
          cardDeleteButton.addClass('btn btn-danger event-button delete-button')
          cardDeleteButton.text('Delete from Saved');
          cardDeleteButton.data('event-id', dbEvent._id);
          
      cardBody.append(cardTitle);
      cardBody.append(cardDateTime);
      cardBody.append(cardVenue);
      cardBody.append(cardDescription);
      cardBody.append(cardLink);
      cardBody.append(cardNoteButton);
      cardBody.append(cardDeleteButton);

      card.append(cardBody);    
      
      $('#eventslist').append(card);
    });
  });  
}


$(document).on("click", ".delete-button", function() {  
  $.ajax({
    method: "POST",
    url: "/events/" + $(this).data("event-id"),
    data: {
      saved: false
    }
  })
  .done(function(data) {
    updateSaves();
    
    $('#savedModalLabel').text("Success!");
    $('#savedModalText').text(data.title + " has been deleted from your saved events.");
    $('#savedModal').modal();  
  })
});


$(document).on("click", ".note-button", function() {      
  $('#noteModalLabel').text("Add a Note");
  $('#noteModal').modal();  
});


updateSaves();

