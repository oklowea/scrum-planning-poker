const socket = io();

let selectedPrices = [];
let usersCount = 0;

let isEnd = false;
let isWeCanVote = false;
let votes = [];
let unVotes = [];

const currentEstimateElement = document.querySelector(
  '[data-js="current-option"]',
);
const eyeIcon =
  '<svg height="32px" fill="#912300" id="Layer_1" version="1.1" viewBox="0 0 64 64" width="32px" xml:space="preserve" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><g><path clip-rule="evenodd" d="M32,7.173C18.311,7.173,7.174,18.311,7.174,32   c0,13.689,11.137,24.827,24.826,24.827c13.689,0,24.826-11.138,24.826-24.827C56.826,18.311,45.689,7.173,32,7.173z M32,43.064   c-11.6,0-17.855-10.826-17.855-10.826S20.4,21.41,32,21.41c11.601,0,17.856,10.828,17.856,10.828S43.601,43.064,32,43.064z" fill-rule="evenodd"/><path clip-rule="evenodd" d="M32,23.005c-5.091,0-9.232,4.142-9.232,9.232c0,5.09,4.142,9.231,9.232,9.231   s9.232-4.142,9.232-9.231C41.232,27.147,37.091,23.005,32,23.005z M32,38.469c-3.437,0-6.232-2.796-6.232-6.231   c0-3.437,2.796-6.232,6.232-6.232s6.232,2.796,6.232,6.232C38.232,35.673,35.437,38.469,32,38.469z" fill-rule="evenodd"/><path clip-rule="evenodd" d="M34.297,32.614c-1.229,0-2.225-0.996-2.225-2.227   c0-1.103,0.809-2.015,1.867-2.188c-0.589-0.284-1.241-0.457-1.939-0.457c-2.48,0-4.494,2.017-4.494,4.495   c0,2.483,2.014,4.494,4.494,4.494c2.481,0,4.494-2.011,4.494-4.494c0-0.358-0.053-0.702-0.132-1.036   C36.037,32.028,35.237,32.614,34.297,32.614z" fill-rule="evenodd"/></g></svg>';

function setSelectedPrices(prices) {
  selectedPrices = prices;

  votes = selectedPrices.filter((o) => o.price !== -1);
  unVotes = selectedPrices.filter((o) => o.price === -1);

  isEnd = usersCount - unVotes.length === votes.length && votes.length > 1;
  isWeCanVote = !unVotes.find((o) => o.id === socket.id);
}

const voter = document.querySelector('[data-js="voter"]');
const labelVoter = document.querySelector('[data-js="label-voter"] span');

voter.addEventListener('change', () => {
  if (voter.checked) {
    labelVoter.innerHTML = 'You are a voter';
    socket.emit('selected:option', null);
  } else {
    labelVoter.innerHTML = 'You are not a voter';
    socket.emit('selected:option', -1);
  }
});

const reset = document.querySelector('[data-js="reset"]');
reset.addEventListener('click', () => {
  socket.emit('reset');
});

const options = document.querySelectorAll('[data-js="options"] div');
options.forEach((option) =>
  option.addEventListener('click', () => {
    if (isEnd || (!isEnd && !isWeCanVote)) {
      return;
    }

    options.forEach((optionElement) => {
      optionElement.classList.remove('bg-sky-500/50');
    });

    if (this.innerHTML === '1/2') {
      socket.emit('selected:option', 0.5);
    } else {
      socket.emit('selected:option', Number(this.innerHTML));
    }

    this.classList.add('bg-sky-500/50');
  }),
);

socket.on('users:count', (count) => {
  usersCount = count;

  const result = document.querySelector('[data-js="result"]');
  result.innerHTML = '';
  for (let i = 0; i < usersCount; i += 1) {
    result.innerHTML +=
      '<div class="flex justify-center items-center w-12 h-20 bg-gray-200 mr-2 rounded-md"></div>';
  }
});

socket.on('selected:prices', (prices) => {
  setSelectedPrices(prices);

  options.forEach((option) => {
    option.classList.remove('bg-sky-500/50');
  });

  for (let i = 0; i < usersCount; i += 1) {
    const item = document.querySelector(
      `[data-js="result"] div:nth-child(${i + 1})`,
    );
    item.classList.remove('bg-red-200');
    item.classList.remove('bg-sky-500/50');
    item.innerHTML = '';
  }

  currentEstimateElement.innerHTML = "You haven't estimated yet";

  if (selectedPrices.length) {
    const selectedPrice = selectedPrices.find((o) => o.id === socket.id);
    if (selectedPrice) {
      document.querySelectorAll('[data-js="options"] div').forEach((option) => {
        const price =
          option.innerHTML === '1/2' ? 0.5 : Number(option.innerHTML);
        if (price === selectedPrice.price) {
          option.classList.add('bg-sky-500/50');
        }
      });

      if (selectedPrice.price === 0.5) {
        currentEstimateElement.innerHTML = 'Your current estimate: 1/2';
      } else if (selectedPrice.price === -1) {
        currentEstimateElement.innerHTML = '&nbsp;';
      } else {
        currentEstimateElement.innerHTML = `Your current estimate: ${selectedPrice.price}`;
      }
    }

    for (let i = 0; i < selectedPrices.length; i += 1) {
      const item = document.querySelector(
        `[data-js="result"] div:nth-child(${i + 1})`,
      );

      if (selectedPrices[i].price === -1) {
        item.classList.add('bg-red-200');
        item.innerHTML = eyeIcon;
      } else {
        item.innerHTML = 'X';

        if (selectedPrices[i].id === socket.id) {
          item.classList.add('bg-sky-500/50');
        }
      }
    }

    const average = document.querySelector('[data-js="average"]');
    if (isEnd) {
      let summa = 0;
      for (let i = 0; i < selectedPrices.length; i += 1) {
        const item = document.querySelector(
          `[data-js="result"] div:nth-child(${i + 1})`,
        );
        if (selectedPrices[i].price === 0.5) {
          item.innerHTML = '1/2';
        } else if (selectedPrices[i].price === -1) {
          item.innerHTML = eyeIcon;
        } else {
          item.innerHTML = selectedPrices[i].price;
        }

        if (selectedPrices[i].price !== -1) {
          summa += selectedPrices[i].price;
        }
      }

      const result = summa / votes.length;
      if (Math.ceil(result) === result) {
        average.innerHTML = `Average: ${result}`;
      } else {
        average.innerHTML = `Average: ${Math.ceil(result)} (${result.toFixed(
          2,
        )})`;
      }
    } else {
      average.innerHTML = '';
    }
  } else {
    currentEstimateElement.innerHTML = "You haven't estimated yet";

    const items = document.querySelectorAll('[data-js="result"] div');
    items.forEach((item) => {
      // eslint-disable-next-line no-param-reassign
      item.innerHTML = '';
      item.classList.add('bg-gray-200');
      item.classList.remove('bg-sky-500/50');
    });

    const average = document.querySelector('[data-js="average"]');
    average.innerHTML = '';
  }
});
