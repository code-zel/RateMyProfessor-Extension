

// Selected schoolID. Tells RMP what university we're looking for.
const SCHOOLID = "U2Nob29sLTQ4MQ=="

// With a given name fetch the teacher information.
async function fetchProfessor(name) {
    const formatedName = encodeURIComponent(name); // Needed for the referrer url.

    try {
        // Graphql call to fetch teacher information
        const request = await fetch("https://www.ratemyprofessors.com/graphql", {
            "credentials": "include",
            "headers": {
                "User-Agent": "Mozilla/5.0 (Windows NT 6.1; Win64; x64; rv:104.0) Gecko/20100101 Firefox/104.0",
                "Accept": "*/*",
                "Accept-Language": "en-US,en;q=0.5",
                "Content-Type": "application/json",
                "Authorization": "Basic dGVzdDp0ZXN0",
                "Sec-Fetch-Dest": "empty",
                "Sec-Fetch-Mode": "cors",
                "Sec-Fetch-Site": "same-origin",
                "Sec-GPC": "1"
            },
            "referrer": `https://www.ratemyprofessors.com/search/teachers?query=${formatedName}&sid=${SCHOOLID}`,
            "body": `{\"query\":\"query TeacherSearchResultsPageQuery(\\n  $query: TeacherSearchQuery!\\n  $schoolID: ID\\n) {\\n  search: newSearch {\\n    ...TeacherSearchPagination_search_1ZLmLD\\n  }\\n  school: node(id: $schoolID) {\\n    __typename\\n    ... on School {\\n      name\\n    }\\n    id\\n  }\\n}\\n\\nfragment TeacherSearchPagination_search_1ZLmLD on newSearch {\\n  teachers(query: $query, first: 8, after: \\\"\\\") {\\n    didFallback\\n    edges {\\n      cursor\\n      node {\\n        ...TeacherCard_teacher\\n        id\\n        __typename\\n      }\\n    }\\n    pageInfo {\\n      hasNextPage\\n      endCursor\\n    }\\n    resultCount\\n    filters {\\n      field\\n      options {\\n        value\\n        id\\n      }\\n    }\\n  }\\n}\\n\\nfragment TeacherCard_teacher on Teacher {\\n  id\\n  legacyId\\n  avgRating\\n  numRatings\\n  ...CardFeedback_teacher\\n  ...CardSchool_teacher\\n  ...CardName_teacher\\n  ...TeacherBookmark_teacher\\n}\\n\\nfragment CardFeedback_teacher on Teacher {\\n  wouldTakeAgainPercent\\n  avgDifficulty\\n}\\n\\nfragment CardSchool_teacher on Teacher {\\n  department\\n  school {\\n    name\\n    id\\n  }\\n}\\n\\nfragment CardName_teacher on Teacher {\\n  firstName\\n  lastName\\n}\\n\\nfragment TeacherBookmark_teacher on Teacher {\\n  id\\n  isSaved\\n}\\n\",\"variables\":{\"query\":{\"text\":\"${name}\",\"schoolID\":\"${SCHOOLID}\",\"fallback\":true,\"departmentID\":null},\"schoolID\":\"${SCHOOLID}\"}}`,
            "method": "POST",
            "mode": "cors"
        });
        
        let temp = await request.json();
        return temp
    } catch (error) {
        return null;
    }
}

// Example of multiple matches https://www.ratemyprofessors.com/search/teachers?query=Susan%20Young&sid=U2Nob29sLTQ4MQ==
// Probably just have it link to query.
// Picks out the teacher object from the graphql response
function processReturn(returnObject) {
    let temp;
    let resultCount;
    try {
        // Deals with the fact that there are multiple teachers with the same name.
        resultCount = returnObject.data.search.teachers.resultCount;
        temp = returnObject.data.search.teachers.edges[0].node;
        if (resultCount > 1 ) {
            temp.multipleMatches = resultCount;
        }
    } catch (error) {
        // Deals with returns that don't match the pattern.
        temp = null;
    }
    return temp;
}

// Find all the elements containing the names
function getAllMailLinks() {
    // Select all the links on the page
    let links = document.getElementsByTagName("a");
    // Transform it into an array for ease of use
    let linkArray = Array.from(links)
    // Filter out all links that arent mailto: addresses
    linkArray = linkArray.filter((link) => {
        return link.href.slice(0,7) === "mailto:";
    });

    return linkArray;
}

// Find all unique names to reduce duplicate queries to RMP
function findUniqueNames(links) {
    let uniqueNames = new Set();
    links.forEach((link) => {
        uniqueNames.add(link.target)
    });
    return uniqueNames;
};

// Create and insert the rating field
function insertRating(link, teacherObject) {
    // Create new row element for rating.
    let newTDTag = document.createElement("td");
    // Checks if there is no teacher data and thus answers so and makes the link go to a search for the university.
    if (teacherObject === undefined) {
        newTDTag.innerHTML = `<a href="https://www.ratemyprofessors.com/search/teachers?query=${encodeURIComponent(link.target)}&sid=${SCHOOLID}" rel="noreferrer noopener" target="_blank" style="font-size: 90%">No data</a>`
    } else if (teacherObject.hasOwnProperty("multipleMatches")) {
        newTDTag.innerHTML = `<a href="https://www.ratemyprofessors.com/search/teachers?query=${encodeURIComponent(link.target)}&sid=${SCHOOLID}" rel="noreferrer noopener" target="_blank" style="font-size: 90%">${teacherObject.multipleMatches} Teachers with that name</a>`
    } else {
        // Check if there is a take again percentage if not there is none.
        if (teacherObject.wouldTakeAgainPercent === -1) {
            // No percentage
            newTDTag.innerHTML = `<a href="https://www.ratemyprofessors.com/ShowRatings.jsp?tid=${teacherObject.legacyId}" rel="noreferrer noopener" target="_blank" style="font-size: 90%">Quality ${teacherObject.avgRating}/5<br>Difficulty ${teacherObject.avgDifficulty}%</a>`
        } else {
            // There is a percentage
            let wouldTakeAgain = Math.round(teacherObject.wouldTakeAgainPercent);
            newTDTag.innerHTML = `<a href="https://www.ratemyprofessors.com/ShowRatings.jsp?tid=${teacherObject.legacyId}" rel="noreferrer noopener" target="_blank" style="font-size: 90%">Quality ${teacherObject.avgRating}/5<br>Difficulty ${teacherObject.avgDifficulty}/5<br>Would take again ${wouldTakeAgain}%</a>`
        }
    }
    // Insert it at the end of the <tr> row.
    link.parentNode.parentNode.insertBefore(newTDTag, link.parentNode.nextSibling);
    // Inserts a new <td> tag that describes the type in the table.
    link.parentNode.parentNode.previousElementSibling.innerHTML += '<th class="ddheader" scope="col">RMP Rating</th>';
    
    return;
}


// C style main function to be able to use await and not hog the main thread.
// We wait between requests to ratemyproffessor as to not send 30-40 requests in less then 1 second.
// The wait is mutating the dom and just not async fetch promising all at the same time.
// If they in the future rate limit it, waiting deliberately between requests might be needed.
async function mainFunc(){
    let linkArray = getAllMailLinks();
    let setOfUniqueNames = findUniqueNames(linkArray);
    //let amountOfUniqueNames = setOfUniqueNames.size;
    
    let teacherReturnInfo; // Holds the fetched info about the teacher
    let matchingLinks; // Holds the matching links for the fetched teacher.
    // Fetch each teachers data.
    for (const teacherName of setOfUniqueNames) {
        teacherReturnInfo = processReturn(await fetchProfessor(teacherName));  
        if (teacherReturnInfo) { // Only add it to the queue if it has a match.
            
            // Find the links with the matching teacher
            matchingLinks = linkArray.filter((link) => {
                return link.target === teacherName; // Teacher name since the query might have fetched a similar but different teacher name and it will be caught in the insert function.
            });
            // For speed up remove matches from link array.
            
            // Create the fields with the data for each instance of that teachers class.
            for (let i = 0; i < matchingLinks.length; i++){
                insertRating(matchingLinks[i], teacherReturnInfo);
            }
        }
    }

}

mainFunc();