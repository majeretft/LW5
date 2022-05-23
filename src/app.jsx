"use strict";

const delay = (time) => {
  return new Promise((resolve) => setTimeout(resolve, time));
};

const App = () => {
  const [token, setToken] = React.useState(null);
  const [limit, setLimit] = React.useState(25);

  const regexToken = /access_token=(\w+)/;
  if (!token && regexToken.test(window.location.hash)) {
    const regexMatchToken = regexToken.exec(window.location.hash);
    setToken(regexMatchToken[1]);
  }

  return (
    <div className="container pt-5">
      <div className="row">
        <div className="col-lg-6 mx-auto">
          <h1>Лабораторная работа №5</h1>

          <p className="lead">
            <b>Задача</b>: <br />
            Среди друзей ваших друзей найти аĸĸаунт, у ĸоторого маĸсимальное
            ĸоличество друзей
          </p>

          <p className="text-danger">
            Внимание: На обращение к API установлены ограничения по количеству
            запросов в секунду! Установлена задержка 250мс. Чтобы не ждать
            результат долго установите ограничение на проверку друзей в поле
            ниже. Это уменьшит время ожидания результата.
          </p>
          <input
            type="number"
            className="form-control mb-3 d-inline-block"
            value={limit}
            onChange={(event) => setLimit(event.target.value)}
          />

          <TokenSection token={token} />

          <hr />

          {token && <FriendsSection token={token} limit={limit} />}
        </div>
      </div>
    </div>
  );
};

const TokenSection = ({ token }) => {
  // ID приложения
  const clientId = window.LW5.clientId;

  // Адрес, на который вернуться после получения токена
  const url = window.location.href;

  // Права доступа https://dev.vk.com/reference/access-rights
  const scope = (0 + 2).toString(2);

  // Ссылка на получение доступа в ВК
  // https://dev.vk.com/api/access-token/implicit-flow-user
  const tokenLink = `https://oauth.vk.com/authorize?client_id=${clientId}&redirect_uri=${url}&scope=${scope}&response_type=token`;

  const messageToken = token ? (
    <React.Fragment>
      Токен для <b>VK API</b> успешно найден в параметре <b>URL</b>
    </React.Fragment>
  ) : (
    <React.Fragment>
      Требуется получить токен <b>VK API</b>. Нажмите ссылку{" "}
      <a href={tokenLink} className="alert-link">
        Получить токен
      </a>
    </React.Fragment>
  );

  return (
    <section>
      <div
        className={`alert ${!token ? "alert-danger" : "alert-success"}`}
        role="alert"
      >
        {messageToken}
      </div>
    </section>
  );
};

const FriendsSection = ({ token, limit }) => {
  const [friendsList, setFriendsList] = React.useState([]);

  const getFriendList = async () => {
    let url = `http://localhost:8010/proxy/method/friends.get?fields=contacts&access_token=${token}&v=5.131`;

    if (+limit > 0) url += `&count=${limit}`;

    const res = await fetch(url);
    const data = await res.json();

    let highest = 0;
    for (let f of data.response.items) {
      // https://dev.vk.com/api/api-requests#%D0%A7%D0%B0%D1%81%D1%82%D0%BE%D1%82%D0%BD%D1%8B%D0%B5%20%D0%BE%D0%B3%D1%80%D0%B0%D0%BD%D0%B8%D1%87%D0%B5%D0%BD%D0%B8%D1%8F
      // Частотные ограничения - 5
      await delay(250);

      const res1 = await fetch(url + `&user_id=${f.id}`);
      const data1 = await res1.json();

      if (!data1.error) {
        f.friendsCount = data1.response.count;
        if (highest < f.friendsCount) highest = f.friendsCount;
      } else {
        f.isProblem = true;
      }
    }

    for (let f of data.response.items) {
      if (highest === f.friendsCount) f.winner = true;
      continue;
    }

    setFriendsList(data.response.items);
  };

  return (
    <React.Fragment>
      <p className="lead">
        <b>Список друзей:</b>
        <br />
        Друг с наибольшим количеством друзей будет отмечен в третьей колонке
        таблицы. Нажмите кнопку для начала поиска <br />
        <button className="btn btn-primary" onClick={getFriendList}>
          Начать!
        </button>
      </p>
      <table className="table table-striped">
        <thead>
          <tr>
            <th>ID друга</th>
            <th>Имя друга</th>
            <th>Количество друзей</th>
            <th>Ошибка</th>
            <th>Gotcha!</th>
          </tr>
        </thead>
        <tbody>
          {friendsList.length > 0 ? (
            <React.Fragment>
              {friendsList.map((e) => (
                <tr key={e.id}>
                  <td>{e.id}</td>
                  <td>{`${e.first_name} ${e.last_name}`}</td>
                  <td>{e.friendsCount}</td>
                  <td>{e.isProblem ? <span>&#9918;</span> : ""}</td>
                  <td>{e.winner ? <span>&#9996;</span> : ""}</td>
                </tr>
              ))}
            </React.Fragment>
          ) : (
            <React.Fragment>
              <tr>
                <td>-</td>
                <td>-</td>
                <td>-</td>
                <td>-</td>
                <td>-</td>
              </tr>
            </React.Fragment>
          )}
        </tbody>
      </table>
    </React.Fragment>
  );
};

const domContainer = document.querySelector("#app");
const root = ReactDOM.createRoot(domContainer);
root.render(<App />);
