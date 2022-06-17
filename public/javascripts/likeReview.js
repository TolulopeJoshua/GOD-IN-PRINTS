

    (function () {
        'use strict'
        const likeButtons = document.querySelectorAll('.lreview')

        Array.from(likeButtons)
          .forEach(function (button) {
        // console.log(button)
            button.addEventListener('click', function (event) {
                let id = button.id;
                axios.get(`/reviews/${id.slice(1)}/like`)
                    .then(function (response) {
                        button.nextElementSibling.innerHTML = response.data === 0 ? '' : response.data;
                    })
                    .catch(function (error) {
                        console.log(error);
                    })
                })
          })  
      })()