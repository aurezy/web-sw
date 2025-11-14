import app from "./app";

const PORT = Number(process.env.PORT ?? 4000);

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`🚀 서버가 포트 ${PORT}에서 실행 중입니다.`);
});
