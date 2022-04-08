

const resultsList = document.querySelector(`#results-list`);
const searchInput = document.querySelector(`#search`);
const searchNavTop = document.querySelector(`#search-nav-top`);
const searchNavBottom = document.querySelector(`#search-nav-bottom`);

const unknowns = ['1ES', '2ES', 'TOB', 'JDT', 'ESG', 'WIS', 'SIR', 'BAR', 'S3Y', 'SUS', 'BEL', 'MAN', '1MA', '2MA'];

search(searchText);

function search(searchText, offset = data.offset) {
    searchInput.value = searchText;
    let resultsHTML = ``;

    if (data.verses) {
      if (!data.verses[0]) {
        searchNavTop.innerHTML = ``;
        searchNavBottom.innerHTML = ``;
        resultsHTML = `<div class="no-results">☹️ No results.</div>`;
      } else {
        const [topSearchNavHTML, searchNavHTML] = buildNav(
          offset,
          data.total,
          searchText
        );
        searchNavTop.innerHTML = topSearchNavHTML;
        searchNavBottom.innerHTML = searchNavHTML;

        resultsHTML += `<ul>`;
        for (let verse of data.verses) {
            if (!unknowns.includes(verse.bookId)){
                resultsHTML += `<li>
                    <h5>${verse.reference}</h5>
                    <div class="small fs-6 not-eb-container">${verse.text}</div>
                    <a href="/bible/chapter?chapter=${verse.chapterId.toLowerCase()}">view chapter</a></li>`;
            }
        }
        resultsHTML += `<ul>`;
      }
    } 

    if (data.passages) {
      searchNavTop.innerHTML = ``;
      searchNavBottom.innerHTML = ``;
      if (!data.passages[0]) {
        resultsHTML = `<div class="no-results">☹️ No results.</div>`;
      } else {
        resultsHTML += `<ul>`;
        for (let passage of data.passages) {
          if (!unknowns.includes(passage.bookId)){
            resultsHTML += `<li>
                <h5>${passage.reference}</h5>
                <div class="small fs-6 eb-container">${passage.content}</div>
                <a href="/bible/chapter?chapter=${passage.chapterIds[0].toLowerCase()}">view chapter</a>
                <br></li>`;
          }
        }
        resultsHTML += `</ul>`;
      }
    }

    resultsList.innerHTML = resultsHTML;
}

function buildNav(offset, total, searchText) {
  const topSearchNavHTML = `<span class="results-count">Showing <b>${
    offset * 20 + 1
  }-${
    offset * 20 + 20 > total ? total : offset * 20 + 20
  }</b> of <b>${total}</b> results.</span>`;
  let searchNavHTML = `<span class="results-current-page"> Current page: <b>${
    offset + 1
  }</b></span>`;

  if (offset > 0 || total / 20 > offset + 1) {
    searchNavHTML += `<span class="results-nav">`;
  }

  if (offset > 0) {
    searchNavHTML += `<a class="btn btn-outline-primary me-3" href="/bible/search?search=${searchText}&offset=${offset - 1}">Previous Page</a>`;
  }

  if (total / 20 > offset + 1) {
    searchNavHTML += `<a class="btn btn-outline-primary" href="/bible/search?search=${searchText}&offset=${offset + 1}">Next Page</a>`;
  }

  if (offset > 0 || total / 20 > offset + 1) {
    searchNavHTML += `</span>`;
  }

  return [topSearchNavHTML, searchNavHTML];
}
