export default oneSecondIncrementedTime = () => {
  const date = new Date();

  return () => {
    date.setSeconds(date.getSeconds() + 1);
    return date.toISOString();
  }
}