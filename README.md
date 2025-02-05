# web-scraping-puppeteer service

[Anti-Bot Measures]:
- Custom Human-like Behavior Simulation: Developed proprietary functions to emulate natural user interactions, executed before critical operations like navigation, clicks, and keystrokes.
- Implemented Stealth Plugin: Utilizing 'puppeteer-extra-plugin-stealth' to mask automation signatures.
- Dynamic User Agent Rotation: Employing 'user-agents' library to mimic diverse browser profiles.
[Performance Trade-off]:
The focus on mimicking human behavior prioritizes stability and undetectability over raw speed. This approach significantly enhances the scraper's resilience against sophisticated anti-bot mechanisms.
[API Design for Enhanced User Experience]:
- POST API: Initiates the scraping process and stores retrieved home listing data.
- GET API: Retrieves previously scraped data from storage.
This dual-API structure optimizes user experience by decoupling the time-intensive scraping process from data retrieval, resulting in faster response times for subsequent queries and improved overall system performance.
While Google's Custom Search JSON API is a viable option for data acquisition, this program employs direct scraping of home listing websites. 

[Instruction]
use `npm install` to install all dependencies
use `npm start` to start the service

[POST /homes]
use `http://localhost:3000/listing-homes`(POST) and put _city_ in the body request _({"city": "Sterling, VA"})_ to start scraping, search and extract home listing information data and then go to child page to fetch details, finally store dat in json. If city is not in request body, it will throw 400 error.
Scraping may take minutes, it depends on the amount of website listing homes. 

[GET /homes]
use `http://localhost:3000/listing-homes?city=${cityname}`(GET) to get all listing homes data in that city area.
Or use `http://localhost:3000/listing-homes?city=Sterling,VA&page=1&pageSize=10` with query paramaters page/pageSize to get information as developer wants

> src/app.ts
The web service server entry file.

> src/api/homes/homes.route.ts
Include two endpoints of listing-homes, POST for searching listing homes information on the website based on city, and store data into src/db/{city}.json file. GET is the method for user fetching stored listing homes, which was extracted from the website before. That's because the human-like-behavior takes longer delay (it's a trade off between performance and stability), so the whole data scraping progress will be much longer than users expect. For better user experience and perfromance optimization, I split into two APIs, then users don't need to hold on the single HTTP connection.

> src/api/homes/homes.service.ts
This is the service layer to realize the listing home data searching on the website. Get specific data through DOM element.

> src/db
store searched home listing information, filename shares the format 'cityname-state', containing list homes with data structure { price, address, beds, baths, sqft, link, children: {description, yearBuilt} }.

> src/helper/index.helper.ts
There are several helper functions, which could be reusable in the other parts. The key function is humanLikeDelay, which mocks user behavior on the browser to bypass website anti-bot strategy.