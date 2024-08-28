const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const api = require('../../utils/apiInstance');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ranking')
        .setDescription('Display the player ranking.'),
    async execute(interaction) {
        try {
            // Appel de l'API pour récupérer le classement des joueurs
            const players = await api.get('api/players/ranking');

            // Vérification si des joueurs sont retournés
            if (players.data.length === 0) {
                try {
                    await interaction.reply('No players found.');
                } catch (replyError) {
                    console.error('Error sending "No players found" reply:', replyError);
                }
                return;
            }

            // Création de l'embed
            const embed = new EmbedBuilder()
                .setTitle('🏆 Player Ranking 🏆')
                .setColor('#c213b8') // Couleur de l'embed
                .setDescription('Here is the player leaderboard:\n')
                .setTimestamp();

            // Formatage du classement pour l'embed
            let rankingDescription = '';
            players.data.forEach((player, index) => {
                rankingDescription += `**${index + 1}. <@${player.discord_id}>** | Points: ${player.total_points}\n`;
            });

            // Mise à jour de la description de l'embed
            embed.setDescription(`Here is the player leaderboard:\n\n${rankingDescription}`);

            // Envoi de l'embed dans le canal Discord
            try {
                await interaction.reply({ embeds: [embed] });
            } catch (replyError) {
                console.error('Error sending ranking embed:', replyError);
                await interaction.followUp('There was an error sending the ranking.');
            }

        } catch (error) {
            console.error('Error fetching ranking:', error);
            try {
                await interaction.reply('There was an error fetching the ranking.');
            } catch (replyError) {
                console.error('Error sending error message:', replyError);
            }
        }
    },
};