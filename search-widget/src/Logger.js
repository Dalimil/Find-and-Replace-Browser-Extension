
import ConnectionApi from './ConnectionApi';

class Logger {
  log(...args) {
    ConnectionApi.log(...args);
  }
}

const MyLogger = new Logger();
export default MyLogger;
