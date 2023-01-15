fetch('/javascripts/bibleData/chapters.json')
.then((response) => response.json())
.then(({data}) => {
  const links = document.getElementById('links');
  data.forEach(book => {
      const name = book.name;
      const chapters = book.chapters;
      chapters.forEach(chapter => {
          const anchor = document.createElement('a');
          anchor.href = `/bible/chapter?chapter=${chapter.id.toLowerCase()}`;
          anchor.innerText = `${name} ${chapter.number}`;
          links.appendChild(anchor);
      })
  })
})

let plan = '3b', startingDate = new Date().toJSON().slice(0,10), 
    planArr = JSON.parse(localStorage.getItem('biblePlan')) || null;
const planPage = document.querySelector('#plans');
const datePage = document.querySelector('#date');
const planner = document.querySelector('#plan');
const createPlanBtn = datePage.querySelector('button');
const loaders = planner.querySelectorAll('.loader');

let func;
if (planArr) {
    func = hydratePlan();
    inflateDaily();
}

const plans = document.querySelectorAll('.plan');
plans.forEach(pln => {
  pln.addEventListener('click', () => {
    plan = pln.id;
    hide(planPage);
  }) 
})

datePage.querySelector('#toplan').addEventListener('click', () => unhide(planPage));
datePage.querySelector('input[type=date]').addEventListener('change', (e) => {
  !e.target.value && (e.target.value = startingDate);
  startingDate = e.target.value;
  createPlanBtn.classList.remove('disabled');
})
document.querySelector('#newPlan').addEventListener('click', () => {
  unhide(planPage); unhide(datePage); 
  document.querySelectorAll('.planDays').forEach(day => day.classList.add('d-none')); 
  document.querySelector('#planOptions').classList.add('d-none')
})
document.querySelector('#newDate').addEventListener('click', () => {
  unhide(datePage); 
  document.querySelectorAll('.planDays').forEach(day => day.classList.add('d-none')); 
  document.querySelector('#planOptions').classList.add('d-none')
})

createPlanBtn.addEventListener('click', async () => {
  hide(datePage); func && document.querySelector('#todayPlan').removeEventListener('click', func);;
  loaders.forEach(loader => loader.classList.remove('d-none'))
  planArr = await createPlan(plan, startingDate);
  localStorage.setItem('biblePlan', JSON.stringify(planArr));
  setTimeout(() => {
    func = hydratePlan();
    inflateDaily();
  }, 2000);
});

function inflateDaily() {
  const daily = document.querySelector('#dailyPlans');
  daily.innerHTML = '';
  planArr.forEach(obj => obj.date = new Date(obj.date));
  const today = planArr.find(obj => (new Date()).toJSON().slice(0,10) == obj.date.toJSON().slice(0,10)) || null;
  if(today) {
    document.querySelector('#menu').querySelector('a[href$="/bible"]').innerText = `Planner (${(new Date()).toJSON().slice(0,10)})`;
    const version = localStorage.getItem('bibleVersion') || 'de4e12af7f28f599-02';
    today.chapters.forEach(item => {
      const line = document.createElement('li');
      line.classList.add('d-md-flex','gap-2')
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

function hydratePlan() {
  let today; hide(datePage); hide(planPage);
  const version = localStorage.getItem('bibleVersion') || 'de4e12af7f28f599-02';
  loaders.forEach(loader => loader.classList.add('d-none'))
  document.querySelector('#planOptions').classList.remove('d-none');
  planArr.forEach(obj => {
    obj.date = new Date(obj.date);
    const button = document.createElement('button');
    button.classList.add('btn','w-100','d-flex','flex-column','planDays')
    button.id = obj.date.getTime();
    const title = document.createElement('h6');
    title.innerText = obj.date.toString().slice(0,15);
    title.classList.add('border-top','text-decoration-underline','text-center','w-100','p-2');
    button.appendChild(title);
    obj.chapters.forEach(item => {
      const line = document.createElement('p');
      line.classList.add('d-flex','text-center','align-items-center','gap-3','p-1','m-0')
      const check = document.createElement('input');
      check.type = 'checkbox';
      check.checked = item.read;
      check.classList.add('form-constrol','p-0','m-0','pe-2',);
      check.addEventListener('change', (e) => {
        item.read = e.target.checked;
        localStorage.setItem('biblePlan', JSON.stringify(planArr));
      })
      line.appendChild(check);
      const text = document.createElement('a');
      text.innerText = item.chapter.name;
      text.href = `/bible/chapter?chapter=${item.chapter.id.toLowerCase()}&version=${version}`;
      line.appendChild(text);
      button.appendChild(line);
    })
    planner.appendChild(button)
    if ((new Date()).toJSON().slice(0,10) == obj.date.toJSON().slice(0,10)) today = button;
  })
  runToday();
  function runToday() {
    if (today) {
      today.focus()
    } else {
      const last = planArr[planArr.length - 1].date, first = planArr[0].date;
      if(last.getTime() < Date.now()) {
        document.getElementById(`${last.getTime()}`).focus();
      } else {
        document.getElementById(`${first.getTime()}`).focus();
      }
      typeof toaster == 'function' && toaster('Today not in Plan!')
    }
  }
  document.querySelector('#todayPlan').addEventListener('click', runToday);
  return runToday;
}

function hide(element) {
  element.style.transform = 'translateX(-100%)';
}

function unhide(element) {
  element.style.transform = 'translateX(0%)';
}

async function createPlan(plan, startingDate) {
  let {data: {data}} = await axios.get('/javascripts/bibleData/chapters.json')
  const oldTestament = data.slice(0,39).reduce((testament, book) => testament.concat(book.chapters.slice(1)), []);
  const newTestament = data.slice(39).reduce((testament, book) => testament.concat(book.chapters.slice(1)), []);
  const hebrews = (data.find(d => d.id == 'HEB')).chapters.slice(1);
  const timothy1 = (data.find(d => d.id == '1TI')).chapters.slice(1);
  const timothy2 = (data.find(d => d.id == '2TI')).chapters.slice(1);
  const oneYear = `${parseInt(startingDate.slice(0,4)) + 1}${startingDate.slice(4)}`;
  const leap = Math.round((new Date(oneYear) - new Date(startingDate)) / (1000 * 60 * 60 * 24)) == 366;
  const extra = leap ? hebrews : timothy1.concat(timothy2);
  switch(plan) {
    case '1a':
      return create({arr1: oldTestament.concat(newTestament), len: 1, startingDate});
    case '1b':
      return create({arr1: newTestament, len: 1, startingDate})
    case '2a':
      return create({arr1: oldTestament.concat(newTestament), len: 2, startingDate})
    case '2b':
      return create({arr1: oldTestament, arr2: newTestament, len: 2, startingDate})
    case '3a':
      return create({arr1: oldTestament.concat(newTestament.concat(extra)), len: 3, startingDate, endingDate: oneYear})
    case '3b':
      return create({arr1: oldTestament, arr2: newTestament.concat(extra), len: 3, startingDate, endingDate: oneYear})
    }
  function create(plan) {
    const result = [];
    let arr2 = plan.arr2 && [...plan.arr2]
    let date = new Date(plan.startingDate);
    date = new Date(date.setDate(date.getDate() - 1));
    while(plan.arr1.length) {
      const obj = {date, chapters: []}
      date = new Date(date.setDate(date.getDate() + 1));
      let len = plan.endingDate && [0, 6].includes(date.getDay()) ? plan.len + 1 : plan.len;
      if (arr2) {
        obj.chapters.push({chapter: arr2.shift(), read: false})
        !arr2.length && (arr2 = !plan.endingDate ? [...plan.arr2] : null);
        len -= 1;
      }
      for (let i = 0; i < len; i++) {
        plan.arr1.length && obj.chapters.push({chapter: plan.arr1.shift(), read: false})
      }
      for (item of obj.chapters) {
        item.chapter.name = getName(item.chapter);
      }
      result.push(obj);
    }
    return result; 

    function getName(chapter) {
      const book = data.find(d => d.id == chapter.bookId);
      return `${book.name} ${chapter.number}`;
    }
  }
}