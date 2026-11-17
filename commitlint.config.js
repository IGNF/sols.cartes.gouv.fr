export default {
  extends: ['@commitlint/config-conventional'],
  // House style: subjects may start with a ticket id ("M22 review ..."), bodies may hold long URLs.
  rules: {
    'subject-case': [0],
    'body-max-line-length': [0],
    'footer-max-line-length': [0],
  },
};
