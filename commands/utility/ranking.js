const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const api = require('../../utils/apiInstance'); // Utiliser require pour les modules CommonJS

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ranking')
        .setDescription('Display the player ranking.'),
    async execute(interaction) {
        try {
            // Appel de la méthode get pour récupérer le classement des joueurs
            const players = await api.get('ranking');

            if (players.data.length === 0) {
                await interaction.reply('No players found.');
                return;
            }

            // Création de l'embed
            const embed = new EmbedBuilder()
                .setTitle('🏆 Player Ranking 🏆')
                .setColor('#c213b8') // Couleur de l'embed
                .setDescription('Voici le classement des joueurs :\n')
                .setTimestamp();

            // Limit the number of players to 10
            const topPlayers = players.data.slice(0, 10);


            // Formatage du classement pour l'embed
            let rankingDescription = '';
            topPlayers.data.forEach((player, index) => {
                rankingDescription += `**${index + 1}. ${player.username}** | Points: ${player.total_points}\n`;
            });

            // Mise à jour de la description de l'embed
            embed.setDescription(`Voici le classement des joueurs :\n\n${rankingDescription}`);

            // Envoyer l'embed dans le canal Discord
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error fetching ranking:', error);
            await interaction.reply('There was an error fetching the ranking.');
        }
    },
};
