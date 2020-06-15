This is the current state of things

First, when a person registers it creates a new file for their account with the following structure
user {
	profile: {username and password} // password is encrypted
	firstTime: (1 for yes, 0 for no)
	freetime: {week day number of hours}
	sources {
		This won't be here on the first go but
		classroom : authToken string
		schoolloop : {username and password} // username and password are encrypted
		schoology: {username and password} // username and password are encrypted
		
	}
	events = []
}
Events will be structured like this
event {
	*name: STring
	*description: String
	*class: string
	href: string
	*day: int
	*year: int
	*month: int
	source: string as in "Schoolloop", "AP Classroom", or "Self Created"
}
When a person logs into the server asside from it encrypting the password and keys and stuff, the user's datafile Name is thrown into a sessionKEys array to keep track of their session for 20 minutes, with a special key as well that accesses their specific file.
	this is not too hard to figure out, just look at the login POST side.

After I gather all the data, I will save it in the sessionKey JSON under their key, and that should be that.
The sessionKey json should follow the following structure:
sessionKey{
	key{
		fileName
		userJson : user (see above ^^^)
	}
}

When you send new settings it is just a json called 
userSettings = {
	passwords = {
		currentPassword = ,
		newPassword = ,
	}
	sources = {

		This won't be here on the first go but
		classroom : authToken string
		schoolloop : {username and password} // username and password are encrypted
		schoology: {username and password} // username and password are encrypted
	}
}

THis is the explanation of how the server flow should go.
1) user gets the login page
2) user logs in and has their cookie set with their key. They can now log in
	a) if they have google enabled, they go to google and log in
3) they are then redirected back to the main page with their cookie and the server sees the cookie and gives them the main page
	a) if they have a code, from google, the code is stored in their session Json
4) then the main page, upon starting, sends a user request
5) the server then gives back the user data
	***** This is where is still need to work
	right now the website uses the user's information to webscrape data from websites and then sends back the information
	***** Instead I need the server to 
	a) simply send back the user's data already stored in their sessionJson
	b) the client sends a SECOND request to the server to /compile
	c) the server will then scrape for data from the websites, compare the user's existing array with their scraped array. I will compare name, description, date, and all.  If there are events that are the same, I will delete duplicates, if not i will keep the new events. Then I will commpile all unique events together into one GIANT array that I will send to the user.  Then I will store the Giant array in their sessionJson and their file for storage. 

when the user wants to create an event, i will
1) create the event, and send it to the server
2) parse it into an event on the server side,
3) plug it into the user's sessionJson, and then resave their userJson string to their file

When the user wants to delete an event, i will
1) send the data of that event to the server,
2) parse it into an event on the server side,
3) run through their sessionJson to find one that matches EXACTLY
4) delete it from the Json
5) resave that userJson String to their file again

