
const bibleBooks = document.getElementById("book");
const bibleChapters = document.getElementById("chapter");
const version = document.getElementById("version");


fetch('/javascripts/bibleData/chapters.json')
.then((response) => response.json())
.then(({data}) => {

  for (let i = 0; i < data.length; i++) {
    var book = new Option(data[i].name, i);
    book.value = data[i].id.toLowerCase();
    bibleBooks.options.add(book);
  }
  
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
  
  const audio = document.querySelector('audio');
  version.value == 'de4e12af7f28f599-02' && bibleChapters.value.split('.')[1] != 'intro' && (audio.src = `https://godinprintsdocuments.s3.amazonaws.com/bible/${bibleChapters.value.split('.')[0].toUpperCase()}/${bibleChapters.value.split('.')[1]}.mp3`);
  audio.addEventListener('ended', () => chapters[currIndex + 1] && (window.location.href = `/bible/chapter?chapter=${chapters[currIndex + 1].id.toLowerCase()}&version=${version.value}`) && loadWaiting('Next Chapter...'))
  if (version.value != 'de4e12af7f28f599-02') {
    const info = document.createElement('em');
    info.innerText = 'Enabled for King James Version';
    info.classList.add('small', 'text-muted', 'position-absolute', 'start-50', 'bottom-0', 'translate-middle-x', 'p-1')
    audio.parentElement.appendChild(info)
  }
  
  const chapters = data.reduce((chapters = [], book) => {
    return chapters.concat(book.chapters.filter(chapter => chapter.number != 'intro'));
  }, [])
  const currIndex = chapters.findIndex(chapter => chapter.id == bibleChapters.value.toUpperCase());
  document.querySelectorAll('.prev').forEach(prev => chapters[currIndex - 1] ? (prev.href = `/bible/chapter?chapter=${chapters[currIndex - 1].id.toLowerCase()}&version=${version.value}`) && (prev.innerHTML = `${chapters[currIndex - 1].id}<i class="bi bi-skip-backward-fill ps-2 fs-4"></i>`) : prev.classList.add('invisible'))
  document.querySelectorAll('.next').forEach(next => currIndex != -1 && chapters[currIndex + 1] ? (next.href = `/bible/chapter?chapter=${chapters[currIndex + 1].id.toLowerCase()}&version=${version.value}`) && (next.innerHTML = `<i class="bi bi-skip-forward-fill pe-2 fs-4"></i>${chapters[currIndex + 1].id}`) : next.classList.add('invisible'))
  
})
