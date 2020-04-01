var entities = require("./../config/entities");

module.exports.replaceInString = replaceInString = (str, find, replace) => {
  return str.split(find).join(replace);
};

module.exports.replaceAll = replaceAll = (str, finds, replace) => {
  let newStr = str;
  finds.forEach(find => {
    newStr = replaceInString(newStr, find, replace);
  });
  return newStr;
};

module.exports.uuid = uuid = () =>
  Math.random()
    .toString(36)
    .substring(2) + Date.now().toString(36);

module.exports.charToEntity = char => {
  return entities[char];
};
module.exports.entityToChar = entityName => {
  return Object.keys(entities).find(
    entityKey => entities[entityKey] === entityName
  );
};
