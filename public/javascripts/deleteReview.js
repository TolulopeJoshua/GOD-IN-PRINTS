
    (function () {
        'use strict'
        const deleteButtons = document.querySelectorAll('.dreview');

        Array.from(deleteButtons)
          .forEach(function (button) {
        // console.log(button)
            button.addEventListener('click', function (event) {
                const docId = button.classList[0];
                const reviewId = button.id.slice(1);
                // document.getElementById(reviewId).style.display = "none";
                axios.delete(`${docId}/deleteReview/${reviewId}`)
                    .then(function (response) {
                        document.getElementById(response.data).remove();
                    })
                    .catch(function (error) {
                        console.log(error);
                    })
                })
          })  
      })()