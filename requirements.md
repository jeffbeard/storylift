* create a web application named StoryLift that can accept an uploaded pdf or a url to a job description.
* the application will extract job requirements and qualifications then store them in a mysql database
* the application will also extract the company name and the role name.
* Once the requirements and qualifications are stored, the next view will allow the user to input a story related to those qualifications and requirements in the STAR format. 
* there is a pre-existing database in a local mysql instance named 'storylift'. you can use the root user without a password to connect to it.
* you will need to generate a database schema for the data. stories will be related to a requirement or qualification which in turn will be related to the job description. 
* all tables need two timestamp columns: created and updated
* we don't need a sophisticated parser/extractor if we can use the claude api for this instead. 
* we need a view for uploading, a subsequent view to see a list of job descriptions where we can click into individual job descriptions to see the requirements and qualifications.
* design an easy to use UI model that will allow for a user to quickly submit the STAR stories for each requirement and qualification then save. 
* the user should be able to re-edit any of the stories or the requirements and qualifications. 
* the user should be able to delete a requirement or qualification
* the user should be able to delete a job description and related data
* i'd like to use React for this application
* backend components should also be in javascript
* frontend should use a modern ui design framework.
* this application should be as simple as possible.
* limit the number of dependencies
* the ui should be very simple and intuitive
* the code base should be as small as possible
* this is a pretty basic CRUD application so complexity should not be required. 
* it should be setup for live coding
