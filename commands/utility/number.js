const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('number')
		.setDescription('Display a random number.'),
	async execute(interaction) {
		await interaction.reply(`Your number ${Math.floor(Math.random() * 1000)} OKKKKKKK`);
	},
};