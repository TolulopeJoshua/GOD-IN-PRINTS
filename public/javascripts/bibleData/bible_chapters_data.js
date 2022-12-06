fetch('/javascripts/bibleData/chapters.json')
.then((response) => response.json())
.then((json) => {

const data = json.data

const bibleBooks = document.getElementById("book");
const bibleChapters = document.getElementById("chapter");
const version = document.getElementById("version");

for (let i = 0; i < data.length; i++) {
  var book = new Option(data[i].name, i);
  book.value = data[i].id.toLowerCase();
  bibleBooks.options.add(book);
}

// console.log(unknowns); 

bibleBooks.onchange = function(){
  var sel = bibleBooks.selectedIndex;
  while (bibleChapters.options.length) {
    bibleChapters.remove(0);
  }
  var book = data[sel];
  for (i = 0; i < book.chapters.length; i++) {
    if (i === 0) {      
    var chapter = new Option(" ", i);
    } else {
      var chapter = new Option(book.chapters[i].number, i);
    }
    chapter.value = book.chapters[i].id.toLowerCase();
    bibleChapters.options.add(chapter);
  }
};

bibleChapters.onchange = function(){
  localStorage.setItem('bibleChapter', bibleChapters.value);
  document.getElementById("chapterForm").submit();
}

version.onchange = function() {
  localStorage.setItem('bibleVersion', version.value);
  document.getElementById("chapterForm").submit();
}

bibleChapters.value = localStorage.getItem('bibleChapter') || 'jhn.3';
version.value = localStorage.getItem("bibleVersion") || "de4e12af7f28f599-02";

for(var i, j = 0; i = bibleBooks.options[j]; j++) {
  if(i.value == activeBook) {
      bibleBooks.selectedIndex = j;
      var sel = bibleBooks.selectedIndex;
    
      while (bibleChapters.options.length) {
        bibleChapters.remove(0);
      }
    
      var book = data[sel];
    
      for (i = 0; i < book.chapters.length; i++) {
        if (i === 0) {      
        var chapter = new Option(" ", i);
        } else {
          var chapter = new Option(book.chapters[i].number, i);
        }
        chapter.value = book.chapters[i].id.toLowerCase();
        bibleChapters.options.add(chapter);
      }
      for(var i, j = 0; i = bibleChapters.options[j]; j++) {
          if(i.value == activeChapter) {
              bibleChapters.selectedIndex = j;
              break;
          }
      }
      break;
  }
}


});