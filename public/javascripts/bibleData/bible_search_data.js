

const resultsList = document.querySelector(`#results-list`);
const searchInput = document.querySelector(`#search`);
const searchNavTop = document.querySelector(`#search-nav-top`);
const searchNavBottom = document.querySelector(`#search-nav-bottom`);
const version = document.getElementById("version");

version.value = localStorage.getItem("bibleVersion") || "de4e12af7f28f599-02";
version.onchange = function() {
  localStorage.setItem('bibleVersion', version.value);
  document.getElementById('searchForm').submit();
}

search(searchText);

function search(searchText, offset = data.offset / 20) {
    searchInput.value = searchText;
    let resultsHTML = ``;

    if (data.verses) {
      console.log(data.verses)
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
          resultsHTML += `<li>
              <h5>${verse.reference}</h5>
              <div class="small fs-6 not-eb-container">${verse.text}</div>
              <a href="/bible/chapter?chapter=${verse.chapterId.toLowerCase()}">view chapter</a></li>`;
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
          resultsHTML += `<li>
              <h5>${passage.reference}</h5>
              <div class="small fs-6 eb-container">${passage.content}</div>
              <a href="/bible/chapter?chapter=${passage.chapterIds[0].toLowerCase()}">view chapter</a>
              <br></li>`;
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
    searchNavHTML += `<span class="results-nav d-block d-flex">`;
  }

  if (offset > 0) {
    searchNavHTML += `<a class="btn btn-outline-primary" href="/bible/search?search=${searchText}&offset=${offset - 1}&version=${version.value}">Previous Page</a>`;
  }

  if (total / 20 > offset + 1) {
    searchNavHTML += `<a class="btn btn-outline-primary ms-auto" href="/bible/search?search=${searchText}&offset=${offset + 1}&version=${version.value}">Next Page</a>`;
  }

  if (offset > 0 || total / 20 > offset + 1) {
    searchNavHTML += `</span>`;
  }

  return [topSearchNavHTML, searchNavHTML];
}