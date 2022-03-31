/*
================================================================
* Use this file to modify the JS behavior of the email generator
================================================================
*/


/*-----------------------------
    File generator
------------------------------- */


function downloadUpdateCodeEmailRepresentation(url) {
    fetch(url, {
            method: "GET",
            mode: 'cors',
            headers: {}
        })
        .then(function(response) {
            response.text().then(function(text) {
                updateCodeEmailRepresentation(text)
            });
        }).catch(function(error) {
            document.getElementById('code-inject-target').textContent = "Unable to preview email code. This is likely issue with cors policy and running this exporter from localhost. Test this functionality by publishing through the editor."
        });
}

function updateCodeEmailRepresentation(representation) {
    // Using Juice.js, we can inline the html representation so the CSS is great for any browser
    let result = juice(representation)

    // Using Beautify.js, we can cleanup any generated html code. Tweak this if you need it!
    result = html_beautify(result, {
        "indent_size": "2",
        "indent_char": " ",
        "max_preserve_newlines": "-1",
        "preserve_newlines": false,
        "keep_array_indentation": false,
        "break_chained_methods": false,
        "indent_scripts": "keep",
        "brace_style": "collapse",
        "space_before_conditional": true,
        "unescape_strings": false,
        "jslint_happy": true,
        "end_with_newline": false,
        "wrap_line_length": "0",
        "indent_inner_html": true,
        "comma_first": false,
        "e4x": false,
        "indent_empty_lines": false
    })

    // Inject the code
    document.getElementById('code-inject-target').textContent = result

    // Finally highlight code
    Prism.highlightAll()
}

/*-----------------------------
    Search - Interface
------------------------------- */

$(".search").on("click", function(e) {
    // Toggle the search view when clicking the search icon
    $(".SNSearch").toggleClass("active")
    if ($(".SNSearch").is(".active")) {
        $(".SNSearch-input").val("")
        $(".SNSearch-input").focus()
        $(".SNSearch-results").html(`<p class="section-title empty">Start your search by typing your phrase</p>`)
    }
    e.preventDefault()
})

$(document).keyup(function(e) {
    // Hide the search view with escape key
    if (e.which == 27) $(".SNSearch").removeClass("active")
})

/*-----------------------------
	  Search - Results and processing
  ------------------------------- */

$(".SNSearch-input").on("input", function(e) {
    let searchString = $(this).val()
    let resultObject = $(".SNSearch-results")

    // Don't search for small strings
    if (searchString.length < 2) {
        resultObject.html(`<p class="section-title empty">Start your search by typing your phrase</p>`)
            // No results
        return
    }

    // Configure search. Note that this can be changed so the search returns fuzzy results
    // by changing the trashold, distance (see example > https://fusejs.io/demo.html)
    var options = {
        shouldSort: true,
        threshold: 0.1,
        location: 0,
        distance: 100,
        maxPatternLength: 32,
        minMatchCharLength: 1,
        ignoreLocation: true,
        keys: ["text"],
    }

    // Note: FuseSearchData is index created by the exporter, loaded from si.js
    const fuse = new Fuse(FuseSearchData, options)
    let searchResult = fuse.search(searchString)

    if (searchResult.length === 0) {
        // No result found
        resultObject.html(`<p class="section-title empty">No results found, change your search phrase</p>`)
        return
    }

    // Reset search
    resultObject.html("")

    // Prepare data
    let textResults = []
    let headingResults = []

    for (let result of searchResult) {
        let item = result.item
        item.startIndex = item.text.toLowerCase().indexOf(searchString.toLowerCase())
        item.endIndex = item.startIndex + searchString.length

        if (item.type === "body") {
            textResults.push(item)
        } else {
            headingResults.push(item)
        }
    }

    // Add results matching titles first, then text block results
    if (headingResults.length > 0) {
        resultObject.append(`<p class="section-title">Sections (${headingResults.length})</p>`)
        let count = 0
        for (let heading of headingResults) {
            resultObject.append(`
		  <a href="${heading.url}">
		  <div class="result">
			<p class="section-result-header">${highlightRanges(heading.text, heading.startIndex, heading.endIndex)}</p>
			<p class="section-result-text">On page ${heading.path}</p>
		  </div>
		  </a>`)
                // Allow up to 5 results to be shown
            if (++count > 5) {
                break
            }
        }
    }

    // Add text block results
    if (textResults.length > 0) {
        resultObject.append(`<p class="section-title">Text (${textResults.length})</p>`)
        let count = 0
        for (let text of textResults) {
            resultObject.append(`
		  <a href="${text.url}">
		  <div class="result">
			<p class="section-result-header">${highlightRanges(text.text, text.startIndex, text.endIndex)}</p>
			<p class="section-result-text">On page ${text.path}</p>
		  </div>
		  </a>`)
                // Allow up to 5 results to be shown
            if (++count > 5) {
                break
            }
        }
    }
})

function highlightRanges(s, startIndex, endIndex) {

    if (startIndex === -1) {
        return s
    }

    let beginning = s.substring(0, startIndex)
    let searchResult = s.substring(startIndex, endIndex)
    let end = s.substring(endIndex)

    return `${beginning}<span>${searchResult}</span>${end}`
}

function replaceRange(s, start, end, substitute) {
    return s.substring(0, start) + substitute + s.substring(end)
}

/*-----------------------------
    Versions
------------------------------- */

function loadVersions(url) {
    // Disable versions before they are loaded
    let button = $("#version-container button")
    button.css("pointer-events", "none")

    // Download JSON with version definitions for this particular design system (there is always one version file per design system at domain/version.json)
    $.getJSON(url, function(data) {
        // Get versions
        let versions = data.versions

        // Load versions into the container and set active version
        let menu = $("#version-container .dropdown-menu")

        menu.html("")
        for (let v of versions) {
            // Make the version that fits the current deploy target URL to be the selected one
            let currentVersion = window.location.href.indexOf(v.url) !== -1
            menu.append(`<a class="dropdown-item ${currentVersion ? "checked" : ""}" href="https:${v.url}">${v.name}</a>`)
            if (currentVersion) {
                button.html(`${v.name}`)
            }
        }

        // Enable interaction with the menu
        button.css("pointer-events", "")
    }).fail(function() {
        // If we for some reason fail to download the versions or if the versions don't exist yet, just hide the button, so it doesn't confuse users
        button.hidden = true
    })
}

/*-----------------------------
    Tooltips
------------------------------- */

$(function() {
    $('[data-toggle="tooltip"]').tooltip()
})

/*-----------------------------
    Copy code
------------------------------- */

$(function() {
    $('[data-toggle="copy-from-sandbox"]').click(function(event) {
        // Get code of the sandbox
        event.preventDefault()
        const sandboxId = $(this).attr("data-target")
        const code = window.sandboxEngine.getCodeForSandboxId(sandboxId)
        const cb = navigator.clipboard
        cb.writeText(code)
    })
})

/*-----------------------------
    Sidebar menu for mobile
------------------------------- */

$("#sidebarCollapse").on("click", function(e) {
    // Toggle the dark / light mode when clicking the mode selector
    $(".docs-navigation").toggleClass("d-inline")
    e.preventDefault()
})