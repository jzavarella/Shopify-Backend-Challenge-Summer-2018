/*
  Created by Jackson Zavarella for the Shopify Backend Intern Challenge - Summer 2018 :)
*/

var request = require('request'); // Simple npm module that allows for easy GET requests
var config = require('./config'); // This module contains constants from config.js

var arr = []; // This is the array that will hold the menus
getMenus(config.CHALLENGE_ID, 1, arr, processMenus);

/*
  This method performs a series of GET requests to the server in order to get all of the menu objects from all of the pages.
  The method then calls the processMenusCallback function with the array of all the menus which handles the business logic for determining if there are any cyclical references.
  @param id: id for the challenge as provided by Shopify
  @param page: The page to start the requests from
  @param arr: The array where the menus will be stored
  @param processMenusCallback: The callback function that will be called when all of the menus have been requested
*/
function getMenus(id, page, arr, processMenusCallback) {
  var requestURL = encodeURI(config.BASE_URL + '?id=' + id + '&page=' + page); // Encode the URL to ensure correct formatting
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
  @param menus: An array of menus that need to be traversed in order to determine if there are any cyclical references
*/
function processMenus(menus) {
  var output = {
    valid_menus: [],
    invalid_menus: []
  }; // Create the output object as per the requirements

  for (var i = 0; i < menus.length; i++) { // Iterate over the menus
    var menu = menus[i];
    var traversed = [menu.id]; // Keep track of which menus we have visited from this menu
    if (alreadyCountedFor(menu, output)) { // Check to see if we have already encountered this menu in the output object
      continue; // If we have, skip it
    }
    if (checkChildren(menu, traversed, menus)) { // Recursive function that returns true if the menu is valid and false if the menu is invalid
      output.valid_menus.push({
        root_id: menu.id,
        children: traversed.slice(1) // Slice off the first element as per the output requirements
      }); // Push a new object onto the output object as a valid_menu
    } else {
      output.invalid_menus.push({
        root_id: menu.id,
        children: traversed
      }); // Push a new object onto the output object as an invalid_menu
    }
  }

  console.log(JSON.stringify(output)); // Output the final output JSON as a string
}

/*
  This is a helper function for the processMenus function. It determines if a menu has been accounted for already given a menu object and an output object.
  @param menu: The menu object we are interested in.
  @param output: The current output object from processMenus
  returns true if the menu is already counted for and false if the menu is not counted for already
*/
function alreadyCountedFor(menu, output) {
  // Iterate over each property in the output object (valid_menus, invalid_menus)
  for (var outputProp in output) {
    if (output.hasOwnProperty(outputProp)) {

      for (var i = 0; i < output[outputProp].length; i++) { // Iterate over each menu in the (in)valid_menus object
        var prop = output[outputProp][i]
        if (prop.children.includes(menu.id)) { // Check to see if the menu id we are interested belons to this (in)valid_menus object
          return true;
        }
      }
    }
  }
  return false; // If we have made it out of the loop, the menu we are interested in must not be in the output object
}

/*
  This is a recursive helper function for processMenus that determines if a given menu contains a cyclical reference.
  @param menu: The menu we are interested in.
  @param traversed: An array of menus that we have already been to.
  @param menus: The array of all of the menus.
  returns true if the given menu object is a valid menu and false if it is an invalid menu
*/
function checkChildren(menu, traversed, menus) {
  for (var j = 0; j < menu.child_ids.length; j++) { // Iterate over the children of this menu
    var childId = menu.child_ids[j];
    if (traversed.includes(childId)) { // We have already been to this node which means there is a cyclical reference
      return false;
    } else {
      traversed.push(childId); // Track that we have been to this menu
      return checkChildren(getMenuWithId(menus, childId), traversed, menus); // Recursively call this function to continue traversing through child menus
    }
  }
  return true; // We have no children left to traverse so this is a valid menu
}

/*
  Helper function for checkChildren that grabs the menu object from the menus array with the given id.
  @param menus: The array of menus.
  @param id: The id of the menu we want to extract from the array.
  returns the menu object or null if it does not exist.
*/
function getMenuWithId(menus, id) {
  for (var i = 0; i < menus.length; i++) {
    if (menus[i].id == id) {
      return menus[i];
    }
  }
  return null;
}
