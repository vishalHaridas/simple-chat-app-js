export default oneSecondIncrementedTime = (date) => {
  return (increment = 1) => {
    date.setSeconds(date.getSeconds() + increment);
    return date.toISOString();
  }
}