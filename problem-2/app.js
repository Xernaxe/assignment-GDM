const fs = require('fs');

const isValidScopeName = (scope) => {
	return /^[A-Za-z0-9_]+$/.test(scope);
};

const main = () => {
	const content = fs.readFileSync('input.txt', 'utf8');
	const lines = content.split('\n').map((line) => line.trim());

	const startScopes = lines.shift().split(' ');

	// endScopes should naturally have the same order as startScopes, but reversed
	const endScopes = startScopes.map((scope) => `end${scope}`).reverse();
	const foundScopes = [];
	const scopeNames = [];
	const cursor = '*';

	let errors = [];

	for (let i = 0; i < lines.length; i++) {
		if (lines[i].includes(cursor)) continue;

		const [scope, scopeName] = lines[i].split(' ');

		if (startScopes.includes(scope)) {
			// line is startScope
			if (!isValidScopeName(scopeName)) {
				errors.push('The scope has an incorrect name.');
				continue;
			}
			scopeNames.push(scopeName);
			foundScopes.push(scope);
		} else if (endScopes.includes(scope)) {
			const expectedEndScope = endScopes.shift();
			console.log(expectedEndScope);
		}
	}

	if (errors.length === 0) console.log(scopeNames.join(' > '));
	else {
		errors.forEach((error) => console.log(error));
	}
};

main();
