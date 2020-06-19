var lunrIndex, pagesIndex;
var MAX_RESULTS = 20;

function endsWith(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

// Initialize lunrjs using our generated index file
function initLunr() {
    if (!endsWith(baseurl,"/")){
        baseurl = baseurl+'/'
    };

    // Retrieve the pre-compiled lunrJS index.
    $.getJSON(baseurl +"search-index.json")
    .done(function(data) {
        lunrIndex = lunr.Index.load(data)
    })
    .fail(function(jqxhr, textStatus, error) {
        var err = textStatus + ", " + error;
        console.error("Error getting search index file:", err);
    });

    // Still need the hugo index because lunr only retuns refs
    $.getJSON(baseurl +"index.json")
    .done(function(hugoIndex) {
        pagesIndex = {};
        // Build a map, for quicker searching than array
        hugoIndex.forEach(function(page) {
            pagesIndex[page.uri] = page;
        })
    })
    .fail(function(jqxhr, textStatus, error) {
        var err = textStatus + ", " + error;
        console.error("Error getting Hugo index file:", err);
    });

}

/**
 * Trigger a search in lunr and transform the result
 *
 * @param  {String} query
 * @return {Array}  results
 */
function search(query) {
    // Perform Lunr search
    var searchResults = lunrIndex.search(query)
    // Only take the first 20 as we don't want to fill the dom on generic requests
    // like "Gloo" or "Kubernetes". They are already sorted by relevance.
    var numResults = searchResults.length > MAX_RESULTS ? MAX_RESULTS : searchResults.length;
    return searchResults.slice(0,numResults).map(function(result) {
        // Return the full item from the hugo index.
        return pagesIndex[result.ref];
    });
}

// Let's get started
initLunr();
$( document ).ready(function() {
    var searchList = new autoComplete({
        /* selector for the search box element */
        selector: $("#search-by").get(0),
        /* source is the callback to perform the search */
        source: function(term, response) {
            response(search(term));
        },
        /* renderItem displays individual search results */
        renderItem: function(item, term) {
            var numContextWords = 2;
            var text = item.content.match(
                "(?:\\s?(?:[\\w]+)\\s?){0,"+numContextWords+"}" +
                    term+"(?:\\s?(?:[\\w]+)\\s?){0,"+numContextWords+"}");
            item.context = text;
            return '<div class="autocomplete-suggestion" ' +
                'data-term="' + term + '" ' +
                'data-title="' + item.title + '" ' +
                'data-uri="'+ item.uri + '" ' +
                'data-context="' + item.context + '">' +
                '» ' + item.title +
                '<div class="context">' +
                (item.context || '') +'</div>' +
                '</div>';
        },
        /* onSelect callback fires when a search suggestion is chosen */
        onSelect: function(e, term, item) {
            location.href = item.getAttribute('data-uri');
        }
    });
});