/*************************************************************
	All coding by Tom Dance
	@tomdance or tom.dance@gmail.com
    
    For the optimisation nerds out there, yes I know I should
    minify this file. But you wouldn't be able to read all my 
    lovely comments if I did.
*************************************************************/

//Declare global variables
var intSecondsRemaining, strCurrentAgendaItem, intDelayTime, boolSkipToNextItem;
var t = 0;

//Create main arrays
var arrAgendaItems, arrAgendaTimes;

//Create integer to keep track of how many items we have
var intAgendaItemCount;

//Create a resources array with a bunch of constants
var resources = {
	strAgendaSet: "Agenda set successfully.",
	strAgendaFormatIncorrect: "Agenda format is incorrect. Please fix or see the help for more info.",
	strSystemTitle: "Meeting Ticker - keep your meeting and agenda on track and on time",
	strAgendaTimeReset: "0:00",
	strAgendaItemReset: "Set some agenda items to get started",
	strMeetingStopped: "Meeting stopped",
	strMeetingPaused: "Meeting paused",
	strMeetingFinished: "Finished",
	strDurationPrefix: " Your meeting is ",
	strDurationSuffix: " minutes long",
	strResume: "RESUME",
	strPause: "PAUSE",
	strCharLimit: "Character limit reached, sorry :(",
	strBitlyError: "Woah, there was an error saving your agenda. Maybe try again...?"
};

//Get going with the fun stuff!
$(document).ready(function () {

	//More variable assignments to make life easy
	var txtAgendaItems = $("#txtAgendaItems");

	var btnSetAgenda = $("#btnSetAgenda");
	var btnEditAgenda = $("#btnEditAgenda");
	var btnStopMeeting = $("#btnStopMeeting");
	var btnStartMeeting = $("#btnStartMeeting");
	var btnPauseResumeMeeting = $("#btnPauseResumeMeeting");
	var btnNextAgendaItem = $("#btnNextAgendaItem");
	var btnStartAgain = $("#btnStartAgain");
	var btnSaveAgenda = $("#btnSaveAgenda");

	var divAgendaItem = $("#agendaItem");
	var divAgendaTime = $("#agendaTime");
	var divUrlDetails = $("#urlDetails");
	var divAgendaReadOnly = $("#agendaReadOnly");

	var aAgendaUrl = $("#agendaUrl");

	var chkbxGetBitlyUrl = $("#chkbxGetBitlyUrl");

	var strWatermark = "Enter your agenda items here using the following format:\n\nMins Agenda Item 1 \nMins Agenda Item 2\n\n"
	strWatermark += "For example:\n";
	strWatermark += "5 Welcome and introduction of attendees\n";
	strWatermark += "10 Discussion of latest report and feedback\n";
	strWatermark += "3 Update from Barry on the office move next week\n";

	//Apply a watermark to the textbox
	txtAgendaItems.Watermark(strWatermark);

	//Set up visibility of buttons and stuff
	ShowControlButtons(false);

	//Hide the stop button
	btnStopMeeting.hide();

	//Hide the agenda link
	aAgendaUrl.hide();

	//Parse the query string as the final step
	ParseQueryString();

	/*************************************************************
	BUTTON: SET AGENDA
	*************************************************************/
	btnSetAgenda.click(function () {

		//Hide the watermark
		$.Watermark.HideAll();

		//Declare local variables
		var arrAgendaLines = txtAgendaItems.val().split(/\n/); //Split per new line from the textbox contents
		var arrAgendaItem = [];
		var boolNotAnInt = false;
		var intMeetingDuration = 0;

		//Re-init the items and times arrays
		arrAgendaItems = [];
		arrAgendaTimes = [];

		//Now build an array using each line and split on the special character
		for (var i = 0; i < arrAgendaLines.length; i++) {

			//Split the agenda line on each space
			arrAgendaItem = arrAgendaLines[i].split(" ");

			//Assign the agenda time and item to separate arrays by popping the first item and rejoining the rest
			arrAgendaTimes[i] = arrAgendaItem.shift();
			arrAgendaItems[i] = arrAgendaItem.join(" ");
		}

		//Check the item in arrAgendaTimes are integers
		for (i = 0; i < arrAgendaTimes.length; i++) {
			if (isInt(arrAgendaTimes[i]) == false) {
				//Set the flag
				boolNotAnInt = true;

				//Shortcut the loop if we have a non-integer
				i = arrAgendaTimes.length;
			} else {
				//Add the time to the total duration
				intMeetingDuration += parseInt(arrAgendaTimes[i]);
			}
		}

		//If the boolNotAnInt flag has not been set, we can continue
		if (boolNotAnInt == false) {
			//Set the textbox to be read only
			txtAgendaItems.attr('readonly', 'readonly');

			//Show the success notification
			showNotification(resources.strAgendaSet + resources.strDurationPrefix + intMeetingDuration + resources.strDurationSuffix);

			//Hide btnSetAgenda and show edit, start and save buttons
			btnSetAgenda.hide();
			btnEditAgenda.show();
			btnStartMeeting.show();
			btnSaveAgenda.show();

			//Hide the textbox
			txtAgendaItems.hide();

			//Create a list for the agenda items
			var strAgendaHtml = "<ul id='agendaItemsReadOnly'>";

			for (i = 0; i < arrAgendaTimes.length; i++) {
				strAgendaHtml += "<li>" + arrAgendaTimes[i] + " mins: " + arrAgendaItems[i] + "</li>";
			}
			strAgendaHtml += "</ul><hr class='horizontalDivider' />";

			//Display the list
			divAgendaReadOnly.html(strAgendaHtml);

		} else {
			//Show the user an error
			showWarning(resources.strAgendaFormatIncorrect);

			//Focus back to textbox
			txtAgendaItems.focus();
		}
	});

	/*************************************************************
	BUTTON: EDIT AGENDA
	*************************************************************/	
	btnEditAgenda.click(function () {

		//Display the textbox
		txtAgendaItems.show();

		//Remove the read only attribute from the textbox
		txtAgendaItems.removeAttr('readonly');

		//Hide the <li>
		$("#agendaItemsReadOnly").hide();

		//Show btnSetAgenda and show the control buttons
		btnSetAgenda.show();
		ShowControlButtons(false);

		//Hide the agenda link
		aAgendaUrl.hide();

		//Reset the HTML in the read only agenda section
		divAgendaReadOnly.html("");

		//Focus back to textbox
		txtAgendaItems.focus();
	});

	/*************************************************************
	BUTTON: STOP MEETING
	*************************************************************/	
	btnStopMeeting.click(function () {

		//Reset the button visibilities
		ShowControlButtons(false);
		btnStopMeeting.hide();
		btnSetAgenda.show();

		//Hide the agenda link
		aAgendaUrl.hide();

		//Clear (stop) the timer
		clearTimeout(t);

		//Reset the time and agenda
		divAgendaTime.html(resources.strAgendaTimeReset);
		divAgendaItem.stop(true, true).animateHtml(resources.strAgendaItemReset);

		//Reset the HTML in the read only agenda section
		divAgendaReadOnly.html("");

		//Update the title of the page
		document.title = resources.strSystemTitle;

		//Remove the read only attribute from the textbox
		txtAgendaItems.removeAttr('readonly');

		//Show the agenda textbox
		txtAgendaItems.show();

		//Focus back to textbox
		txtAgendaItems.focus();

		//Show a notification
		showWarning(resources.strMeetingStopped);
	});

	/*************************************************************
	BUTTON: START MEETING
	*************************************************************/	
	btnStartMeeting.click(function () {
		//Set the value of the count down variable to the current first item on the array
		intSecondsRemaining = arrAgendaTimes.shift() * 60;

		//Get the current agenda item
		strCurrentAgendaItem = arrAgendaItems.shift();

		//Set the delay time to 1000 ms (1 sec)
		intDelayTime = 1000;

		//Call the countdown function
		startCountdown();

		//Set the value of the agenda item counter
		intAgendaItemCount = 1;

		//Hide the start and edit buttons as we don't need them anymore
		btnStartMeeting.hide();
		btnEditAgenda.hide();

		//Show the stop meeting button and the pause and next buttons
		btnStopMeeting.show();
		btnPauseResumeMeeting.show();
		btnNextAgendaItem.show();
	});


	/*************************************************************
	BUTTON: PAUSE AND RESUME TOGGLE
	*************************************************************/	
	btnPauseResumeMeeting.click(function () {
		if (intDelayTime == 1000) {

			//Change the button text and extend time between execution
			btnPauseResumeMeeting.text(resources.strResume);
			intDelayTime = 1000 * 600;

			//Show info notification
			showInfo(resources.strMeetingPaused);

		} else {

			//Change button text and return to 1 second
			btnPauseResumeMeeting.text(resources.strPause);
			intDelayTime = 1000;
			startCountdown();
		}
	});

	/*************************************************************
	BUTTON: NEXT - move to the next item in the list
	*************************************************************/
	//To move to the next item, set a boolean for the next call of the StartCountdown function
	btnNextAgendaItem.click(function () {
		boolSkipToNextItem = true;

		//Unpause the meeting if necessary
		if (intDelayTime != 1000) {
			btnPauseResumeMeeting.text(resources.strPause);
			intDelayTime = 1000;
			startCountdown();
		}
	});

	/*************************************************************
	BUTTON: SAVE AGENDA VIA BIT.LY
	*************************************************************/
	btnSaveAgenda.click(function () {

		//Hide the save button
		btnSaveAgenda.hide();

		//Generate bit.ly URL
		//Grab the contents of the textbox and replace the spaces and new lines
		var strQueryString, strDomainQueryString, intAgendaLocation, strAgendaItems, strParsedAgenda, strCompleteUrl;

		//Grab the query string
		strQueryString = document.location.href;

		//Search to the end looking for a=
		intAgendaLocation = strQueryString.search('a=');

		//If the value is larger than -1, we have to trim up the string
		if (intAgendaLocation > -1) {
			//Grab the start of the string up to the ?a= section
			strDomainQueryString = strQueryString.slice(0, intAgendaLocation - 1);
		} else {
			strDomainQueryString = strQueryString;
		}

		//Get the agenda items from the textbox value
		strAgendaItems = txtAgendaItems.val();

		//Replace spaces with } and new lines with {
		strParsedAgenda = strAgendaItems.replace(/ /g, '}');
		strParsedAgenda = strParsedAgenda.replace(/\n/g, '{');

		//Build the complete URL
		strCompleteUrl = strDomainQueryString + '?a=' + strParsedAgenda;

		//Bit.ly the URL
		GetBitlyUrl(encodeURI(strCompleteUrl), function (strBitlyStatusCode, strBitlyUrl) {

			if (strBitlyStatusCode == "200") {

				//Display on the screen
				aAgendaUrl.attr('href', strBitlyUrl);
				aAgendaUrl.text(strBitlyUrl);

				//Show the URL
				aAgendaUrl.show();

			} else {

				//We have an error generating the bit.ly link. Show a warning and unhide the button
				showWarning(resources.strBitlyError);

				//Show the save button again
				btnSaveAgenda.show();
			}
		});
	});

	/*************************************************************
	BUTTON: START AGAIN
	*************************************************************/	
	btnStartAgain.click(function () {

		//Reset button visibility
		ShowControlButtons(false);

		//Show the set agenda button
		btnSetAgenda.show();

		//Show the textbox
		txtAgendaItems.show();

		//Focus back to textbox
		txtAgendaItems.focus();

		//Reset the main agenda item text
		divAgendaItem.html(resources.strAgendaItemReset);

		//Reset the HTML in the read only agenda section
		divAgendaReadOnly.html("");
	});

	/*************************************************************
	ENTER AND SPACE KEYBOARD TRIGGERS
	*************************************************************/
	//Set Agenda
	btnSetAgenda.keyup(function (event) {
		objEventKeyCode = event.keyCode;
		if ((objEventKeyCode == 13) || (objEventKeyCode == 32)) {
			btnSetAgenda.click();
		}
	});

	//Edit Agenda
	btnEditAgenda.keyup(function (event) {
		objEventKeyCode = event.keyCode;
		if ((objEventKeyCode == 13) || (objEventKeyCode == 32)) {
			btnEditAgenda.click();
		}
	});

	//Stop Meeting
	btnStopMeeting.keyup(function (event) {
		objEventKeyCode = event.keyCode;
		if ((objEventKeyCode == 13) || (objEventKeyCode == 32)) {
			btnStopMeeting.click();
		}
	});

	//Start Meeting
	btnStartMeeting.keyup(function (event) {
		objEventKeyCode = event.keyCode;
		if ((objEventKeyCode == 13) || (objEventKeyCode == 32)) {
			btnStartMeeting.click();
		}
	});

	//Pause/Resume Meeting
	btnPauseResumeMeeting.keyup(function (event) {
		objEventKeyCode = event.keyCode;
		if ((objEventKeyCode == 13) || (objEventKeyCode == 32)) {
			btnPauseResumeMeeting.click();
		}
	});

	//Next Item
	btnNextAgendaItem.keyup(function (event) {
		objEventKeyCode = event.keyCode;
		if ((objEventKeyCode == 13) || (objEventKeyCode == 32)) {
			btnNextAgendaItem.click();
		}
	});

	//Save Agenda
	btnSaveAgenda.keyup(function (event) {
		objEventKeyCode = event.keyCode;
		if ((objEventKeyCode == 13) || (objEventKeyCode == 32)) {
			btnSaveAgenda.click();
		}
	});

	//Start Again
	btnStartAgain.keyup(function (event) {
		objEventKeyCode = event.keyCode;
		if ((objEventKeyCode == 13) || (objEventKeyCode == 32)) {
			btnStartAgain.click();
		}
	});

	/*************************************************************
	Keyup function to limit character input
	*************************************************************/		
	txtAgendaItems.keyup(function () {
		LimitChars();
	});

	/*************************************************************
	PARSE THE QUERY STRING
	*************************************************************/	
	function ParseQueryString() {

		//Declare some vars yo!
		var strQueryString, strAgendaString, intQuestionMark;

		//Get the query string
		strQueryString = decodeURI(document.location.href);

		//Search for a= and any agenda items
		intQuestionMark = strQueryString.search('a=');

		//Check if the a= character was found
		if (intQuestionMark >= 0) {
			//We have some stuff in the agenda, so let's grab it
			strAgendaString = strQueryString.substring(intQuestionMark + 2);

			//Replace } with a space and { with a new line
			strAgendaString = strAgendaString.replace(/}/g, ' ');
			strAgendaString = strAgendaString.replace(/{/g, '\n');

			//Put the agenda in the agenda textbox
			txtAgendaItems.val(strAgendaString);

			txtAgendaItems.focus();
		}
	}

	/*************************************************************
	SHOW AND HIDE BUTTONS
	*************************************************************/	
	function ShowControlButtons(boolState) {
		btnEditAgenda.toggle(boolState);
		btnStartMeeting.toggle(boolState);
		btnPauseResumeMeeting.toggle(boolState);
		btnNextAgendaItem.toggle(boolState);
		btnStartAgain.toggle(boolState);
		btnSaveAgenda.toggle(boolState);
	}

	/*************************************************************
	COUNTDOWN FUNCTION (DOES MOST OF THE WORK)
	*************************************************************/	
	function startCountdown() {
		//Declare variables
		var intMins, intSeconds, strTimeRemaining;

		//Check if the skip boolean is set
		if (boolSkipToNextItem) {
			intSecondsRemaining = -1;
			boolSkipToNextItem = false;
		}

		if ((intSecondsRemaining) >= 0) {
			//Convert seconds to mins and find out how many seconds remaining
			intMins = Math.floor(intSecondsRemaining / 60);
			intSeconds = intSecondsRemaining - (intMins * 60);

			//Build the time remaining string
			strTimeRemaining = intMins + ":" + LeadingZero(intSeconds);

			//Update the time display and the current agenda item
			divAgendaTime.html(strTimeRemaining);
			divAgendaItem.stop(true, true).animateHtml(strCurrentAgendaItem);	//The stop here makes the animation wait for any running animations

			//Update the document title with the time remaining and the agenda item
			document.title = strTimeRemaining + " " + strCurrentAgendaItem;

			//Subtract one second from the seconds remaining
			intSecondsRemaining = intSecondsRemaining - 1;

			//Execute the function again after a set amount of time
			t = setTimeout(startCountdown, intDelayTime);
		} else {
			//If the array is empty, we've finished and can display a message
			if (arrAgendaTimes.length == 0) {
				divAgendaTime.html(resources.strAgendaTimeReset);
				divAgendaItem.stop(true, true).animateHtml(resources.strMeetingFinished);

				//Update the title of the page
				document.title = resources.strSystemTitle;

				//Stop the timer
				clearTimeout(t);

				//Hide the control buttons and display the set agenda button
				ShowControlButtons(false);
				btnStopMeeting.hide();

				//Show the start again button
				btnStartAgain.show();

				//Hide the agenda link
				aAgendaUrl.hide();

				//Remove the read only attribute from the textbox
				txtAgendaItems.removeAttr('readonly');

				//Put a line through the final item in the list
				$("ul#agendaItemsReadOnly > li:nth-child(" + intAgendaItemCount + ")").css("text-decoration", "line-through");

			} else {

				//Get the next items from the arrays
				intSecondsRemaining = arrAgendaTimes.shift() * (60);
				strCurrentAgendaItem = arrAgendaItems.shift();

				//Call the countdown function again
				startCountdown();

				//Put a line through the expired item
				$("ul#agendaItemsReadOnly > li:nth-child(" + intAgendaItemCount + ")").css("text-decoration", "line-through");

				//Increment the counter
				intAgendaItemCount += 1;
			}
		}
	}

	/*************************************************************
	LIMIT THE NUMBER OF CHARS IN THE TEXTBOX
	*************************************************************/	
	function LimitChars() {
		intCharLimit = 1800;
		strAgendaText = txtAgendaItems.val();

		if (strAgendaText.length > intCharLimit) {
			txtAgendaItems.val(strAgendaText.substr(0, intCharLimit));

			showWarning(resources.strCharLimit);
		}
	}

	/*************************************************************
	ADD A LEADING 0 TO THE TIME
	*************************************************************/	
	function LeadingZero(Time) {
		return (Time < 10) ? "0" + Time : +Time;
	}

	/*************************************************************
	CHECK IF THE VALUE IS AN INT
	*************************************************************/	
	function isInt(value) {
		if ((parseFloat(value) == parseInt(value)) && !isNaN(value)) {
			return true;
		} else {
			return false;
		}
	}

});

/*************************************************************
BIT.LY LINK GENERATOR
*************************************************************/	
//bit.ly API code lifted from http://stackoverflow.com/questions/4760538/using-only-javascript-to-shrink-urls-using-the-bit-ly-api
function GetBitlyUrl(strLongUrl, func) {
    $.getJSON(
                "http://api.bitly.com/v3/shorten?callback=?",
                    {
                        "format": "json",
                        "apiKey": "R_634d657b16c395a6e84e2a6ebb65a074",
                        "login": "dancet",
                        "longUrl": strLongUrl
                    },
                function (response) {
                    func(response.status_code, response.data.url);
                }
    );
}