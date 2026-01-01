# Pranic Healing Management Software
This is supposed to be a Software for managing Pranic Healing Sessions and Protocols along with Keeping track of Clients and their progress, tracking of payments and nurturing sessions.
This will be a Mobile First Application, possibly diving into Progressive Web App as well.
we shall have a vanilla web app as well for desktop users.


## Requirements
1. User needs to maintain a calender with client appointments, payment info, protocol being followed, additional notes, etc.
2. User needs to be able to Maintain a record of nurturing sessions they wish to attend in order to improve knowledge.
3. User must be able to Maintain a record of healing protocols for various problems.

## Database Design
Based on requirements we may want to use a NoSQL Database like mongodb? 
I see essentially 3 collections:
1. Client Data
2. Nurturing Session Data
3. Healing Protocol Data

Only caviate is that we need to maintain payment records for sessions conducted for each client.

## Admin Role
Users need to be maintained, client and admin roles.
admin will have access to all data, client will have access to their own data.
additionally admin can create clients. 
also, delete functionality remains exclusive to admin.


## UI/UX Design
1. Login Page: User Login Page with username and password.
2. Dashboard: This will show sessions planned for today, tomorrow,etc ( this contains list of healing sessions and nurturing sessions). We need to create a calendar view for this. Not a traditional calender, but a calendar that shows sessions for each day.
3. User should be able to add create clients, add recurring sessions (biweekly, triweekly etc), add one-off sessions. Keep a track of number of healings done for the day, etc.
4. User should be able to add info related to nurturing sessions, this includes name, payment details, time, date, and status: like payment done, registered, etc.
5. User should be able to add/update healing protocols and notes. These should be searchable via keywords. 
6. User shuold be able to upload images and pdfs related to healing protocols and nurturing sessions. ( we can store them in file storage and save path in db)

NOTE: The Nurturing Session/Healing Protocols should have Fields for
Session Name, Session Date, Session Cordinator, Recording Available till date, PDF storage, text Storage,image storage
