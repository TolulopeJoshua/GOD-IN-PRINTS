
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
    // localStorage.setItem('bibleChapter', bibleChapters.value);
    document.getElementById("chapterForm").submit();
  }
  
  version.onchange = function() {
    localStorage.setItem('bibleVersion', version.value);
    document.getElementById("chapterForm").submit();
  }
  localStorage.setItem('bibleChapter', (new URLSearchParams(window.location.search)).get('chapter'));
  
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
  document.querySelectorAll('.prev').forEach(prev => chapters[currIndex - 1] ? (prev.href = `/bible/chapter?chapter=${chapters[currIndex - 1].id.toLowerCase()}&version=${version.value}`) && (prev.innerHTML = `${chapters[currIndex - 1].id}<i class="bi bi-skip-backward-fill ps-3 fs-4"></i>`) : prev.classList.add('invisible'))
  document.querySelectorAll('.next').forEach(next => currIndex != -1 && chapters[currIndex + 1] ? (next.href = `/bible/chapter?chapter=${chapters[currIndex + 1].id.toLowerCase()}&version=${version.value}`) && (next.innerHTML = `<i class="bi bi-skip-forward-fill pe-3 fs-4"></i>${chapters[currIndex + 1].id}`) : next.classList.add('invisible'))
  
})

const planArr = JSON.parse(localStorage.getItem('biblePlan')) || [];
inflateDaily();
function inflateDaily() {
  const daily = document.querySelector('#dailyPlans');
  daily.innerHTML = '';
  planArr.forEach(obj => obj.date = new Date(obj.date));
  const today = planArr.find(obj => (new Date()).toJSON().slice(0,10) == obj.date.toJSON().slice(0,10)) || null;
  if(today) {
    document.querySelector('#menu').querySelector('a[href$="/bible"]').innerText += ` (${(new Date()).toJSON().slice(0,10)})`;
    const version = localStorage.getItem('bibleVersion') || 'de4e12af7f28f599-02';
    today.chapters.forEach(item => {
      const line = document.createElement('li');
      line.classList.add('d-flex','gap-2','pe-md-5','w-100','justify-content-center','align-items-center')
      const check = document.createElement('input');
      check.type = 'checkbox';
      check.checked = item.read;
      check.classList.add('form-constrol','p-0','m-0');
      check.addEventListener('change', (e) => {
        item.read = e.target.checked;
        localStorage.setItem('biblePlan', JSON.stringify(planArr));
      })
      line.appendChild(check);
      const anchor = document.createElement('a');
      anchor.innerText = item.chapter.name;
      anchor.href = `/bible/chapter?chapter=${item.chapter.id.toLowerCase()}&version=${version}`;
      line.appendChild(anchor);
      daily.appendChild(line);
    })
  }
}

let savedHighlights = JSON.parse(localStorage.getItem('bibleHighlights')) || [];
let currVerseId;
const highlightBar = document.getElementById('highlightBar');
const highlightColors = document.getElementById('highlightColors');
const verses = document.querySelectorAll('.verse-span');

savedHighlights.forEach(verse => {
  const hVerses = document.querySelectorAll(`.verse-span[data-verse-id="${verse.verseId}"]`);
  hVerses.forEach(vs => vs.style.background = verse.color);
})

verses.forEach(verse => verse.addEventListener('click', () => {
  currVerseId = verse.dataset.verseId;
  const rels = document.querySelectorAll(`.verse-span[data-verse-id="${currVerseId}"]`)
  rels.forEach(rel => {
    rel.classList.toggle('highlighted')
    if (rel.classList.contains('highlighted')) {
      rel.style.background = '';
    } else {
      const saved = savedHighlights.find(h => h.verseId == currVerseId);
      rel.style.background = saved ? saved.color : '';
    }
  })
  const highlight = document.querySelector('.highlighted');
  highlight ? highlightBar.classList.remove('d-none') : closeHighlights();
}))
highlightBar.querySelector('#closeHighlight').addEventListener('click', closeHighlights);
highlightColors.querySelectorAll('button').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('.highlighted').forEach(verse => {
    verse.style.background = button.style.background
    const saved = savedHighlights.find(saved => saved.verseId == verse.dataset.verseId);
    saved ? (saved.color = button.style.background) : savedHighlights.push({verseId: verse.dataset.verseId, color: button.style.background})
  });
  localStorage.setItem('bibleHighlights', JSON.stringify(savedHighlights));
  closeHighlights();
}))
highlightColors.querySelector('input').addEventListener('change', (e) => {
  const c = e.target.value.replace('#', '0x');
  document.querySelectorAll('.highlighted').forEach(verse => {
    verse.style.background = 'rgba('+[(c>>16)&255, (c>>8)&255, c&255].join(',')+', 0.5)'
    const saved = savedHighlights.find(saved => saved.verseId == verse.dataset.verseId);
    saved ? (saved.color = verse.style.background) : savedHighlights.push({verseId: verse.dataset.verseId, color: verse.style.background})
  });
  localStorage.setItem('bibleHighlights', JSON.stringify(savedHighlights));
  e.target.value = '#000000';
  closeHighlights();
})

highlightBar.querySelector('#shareVerses').addEventListener('click', () => {
  const shareData = {
    title: '',
    text: '',
    url: window.location.href
  }
  let text = '', title, verses = [];
  document.querySelectorAll('.highlighted').forEach(verse => {
    text += verse.innerText;
    title = verse.dataset.verseId.split('.').slice(0,2).join(' : ');
    verses = [...verses, parseInt(verse.dataset.verseId.split('.')[2])];
  })
  shareData.title = title + ' vs ' + vs2psg([...new Set(verses)]);
  shareData.text = text;
  navigator.share(shareData);
  // closeHighlights();

  function vs2psg(arr) {
    let psg = [];
    let curr = 0;
    let currP = 0;
    for (let num of arr) {
      if (curr) {
        if (num != curr + 1) {
          currP == curr ? psg.push(`${curr}`) : psg.push(`${currP}-${curr}`);
          currP = num;
        }
      }
      curr = num; !currP && (currP = num);
    }
    if (curr) {
      currP == curr ? psg.push(`${curr}`) : psg.push(`${currP}-${curr}`);
    }
    return psg.join(',');
  }
})

function closeHighlights() {
  document.querySelectorAll('.highlighted').forEach(verse => {
    verse.classList.remove('highlighted');
    const saved = savedHighlights.find(h => h.verseId == verse.dataset.verseId);
    verse.style.background = saved ? saved.color : '';
  });
  highlightBar.classList.add('d-none')
};