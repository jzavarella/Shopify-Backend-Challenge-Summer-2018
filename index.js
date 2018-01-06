var request = require('request'); // Simple npm module that allows for easy GET requests

const BASE = 'https://backend-challenge-summer-2018.herokuapp.com/challenges.json'; // The base url as provided by Shopify

var arr = []; // This is the array that will hold the menus

getMenus(1, 1, arr, processMenus);

/*
  This method performs a series of GET requests to the server in order to get all of the menu objects from all of the pages.
  The method then calls the processMenusCallback function with the array of all the menus which handles the business logic for determining if there are any cyclical references.
  @param id: id for the challenge as provided by Shopify
  @param page: The page to start the requests from
  @param arr: The array where the menus will be stored
  @param processMenusCallback: The callback function that will be called when all of the menus have been requested
*/
function getMenus(id, page, arr, processMenusCallback) {
  var requestURL = BASE + encodeURI('?id=' + id + '&page=' + page); // Encode the URL parameters to ensure consistency
  request(requestURL, processRequest); // Use the included node module to make the request while passing the callback 'processRequest' to handle the response

  /*
    This is a helper function that will push each menu from the request onto the 'arr' array.
    @param body: The body recieved from the get requests
    @param arr: The array storing all of the past menu objects from previous requests
    returns true if the arr array equals the 'pagination total' and false if it does not.
  */
  function processMenuJSON(body, arr) {
    const menus = body.menus;
    const total = body.pagination.total;
    for (var i = 0; i < menus.length; i++)
      arr.push(menus[i]);
    return (arr.length == total);
  }

  //  Callback function as required by the 'request' node module
  function processRequest(error, response, body) {
    if (error) {
      console.error(error); // Something went wrong with the request
      return;
    }
    // Calls the processMenuJSON function sending the response body and arr array containing the past menus
    if (!processMenuJSON(JSON.parse(body), arr)) {
      // if the helper function returned false, there are still more pages to get from the server so the getMenus function is called recursively
      getMenus(id, page + 1, arr, processMenusCallback);
    } else {
      // If the helper function returned true then the arr array contains all of the menus from all of the pages and we can call the processMenusCallback to process the menus
      processMenusCallback(arr);
    }
  }
}

/*
  This function will find and output the valid and invalid menus as per the requirements
  @param menus: Array of menus that need to be traversed in order to determine if there are any cyclical references
*/
function processMenus(menus) {
  console.log(menus);
}
