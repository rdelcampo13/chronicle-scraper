// Grab the articles as a json
$.getJSON("/events", function(dbEvents) {
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
    var cardSaveButton = $('<a>')
        cardSaveButton.addClass('btn btn-primary event-button save-button')
        cardSaveButton.text('Save');
        cardSaveButton.data('event-id', dbEvent._id);
        
    cardBody.append(cardTitle);
    cardBody.append(cardDateTime);
    cardBody.append(cardVenue);
    cardBody.append(cardDescription);
    cardBody.append(cardLink);
    cardBody.append(cardSaveButton);

    card.append(cardBody);    
    
    $('#eventslist').append(card);
  });
});

// When the save button is clicked
$(document).on("click", ".save-button", function() {
  
  $.ajax({
    method: "POST",
    url: "/events/" + $(this).data("event-id"),
    data: {
      saved: true
    }
  })
  .done(function(data) {
    console.log(data);
    $('#homeModalLabel').text("Success!");
    $('#homeModalText').text(data.title + " has been added to your saved events.");
    $('#homeModal').modal();
  })
});

// When the scrape button is clicked
$(document).on("click", ".scrape-button", function() {  
  $.ajax({
    method: "GET",
    url: "/scrape"
  })
  .done(function(data) {
    $('#homeModalLabel').text("Success!");
    $('#homeModalText').text("Events have been scraped from the Austin Chronicle.");
    $('#homeModal').modal();
  })
});



// Whenever someone clicks a p tag
$(document).on("click", "p", function() {
  // Empty the notes from the note section
  $("#notes").empty();
  // Save the id from the p tag
  var thisId = $(this).attr("data-id");

  // Now make an ajax call for the Article
  $.ajax({
    method: "GET",
    url: "/events/" + thisId
  })
    // With that done, add the note information to the page
    .done(function(data) {
      console.log(data);
      // The title of the article
      $("#notes").append("<h2>" + data.title + "</h2>");
      // An input to enter a new title
      $("#notes").append("<input id='titleinput' name='title' >");
      // A textarea to add a new note body
      $("#notes").append("<textarea id='bodyinput' name='body'></textarea>");
      // A button to submit a new note, with the id of the article saved to it
      $("#notes").append("<button data-id='" + data._id + "' id='savenote'>Save Note</button>");

      // If there's a note in the article
      if (data.note) {
        // Place the title of the note in the title input
        $("#titleinput").val(data.note.title);
        // Place the body of the note in the body textarea
        $("#bodyinput").val(data.note.body);
      }
    });
});

// When you click the savenote button
$(document).on("click", "#savenote", function() {
  // Grab the id associated with the article from the submit button
  var thisId = $(this).attr("data-id");

  // Run a POST request to change the note, using what's entered in the inputs
  $.ajax({
    method: "POST",
    url: "/events/" + thisId,
    data: {
      // Value taken from title input
      title: $("#titleinput").val(),
      // Value taken from note textarea
      body: $("#bodyinput").val()
    }
  })
    // With that done
    .done(function(data) {
      // Log the response
      console.log(data);
      // Empty the notes section
      $("#notes").empty();
    });

  // Also, remove the values entered in the input and textarea for note entry
  $("#titleinput").val("");
  $("#bodyinput").val("");
});
