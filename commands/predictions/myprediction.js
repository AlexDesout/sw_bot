const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require('discord.js');
const api = require('../../utils/apiInstance');

// Fonction pour générer un ID unique
function generateUniqueId() {
    return `myprediction_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('myprediction')
        .setDescription('Display all your predictions.'),
    async execute(interaction) {
        const userId = interaction.user.id;

        try {
            // Appel à l'API pour obtenir les prédictions de l'utilisateur
            const predictions = await api.get(`/api/predictions/player/${userId}`);
            const categories = await api.get('/api/categories');

            // Map les catégories par leur ID pour un accès facile
            const categoryMap = new Map(categories.data.map(cat => [cat.id, cat.name]));

            if (predictions.data.length === 0) {
                await interaction.reply({content: 'You have no predictions.', ephemeral: true});
                return;
            }

            // Créer les embeds pour les prédictions
            const embeds = predictions.data.map((p, index) => {
                const categoryName = categoryMap.get(p.category_id) || 'Unknown Category';
                return new EmbedBuilder()
                    .setTitle(`Prediction ${index + 1} 🧐`)
                    .setDescription(`<@${p.user_id}>\nwill be the next in category **${categoryName}**\n\nPredicted on: ${p.created_at}`)
                    .setColor('#c213b8')
                    .setThumbnail(interaction.user.displayAvatarURL()) // Ajouter l'avatar de l'utilisateur
                    .setFooter({ text: `Requested by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });
            });

            if (embeds.length === 0) {
                await interaction.reply('No valid predictions found.');
                return;
            }

            let currentPage = 0;
            const uniqueId = generateUniqueId(); // Générer un ID unique pour cette commande

            // Créer les boutons de navigation et le bouton de suppression
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`${uniqueId}_previous`)
                        .setLabel('Previous')
                        .setStyle('Primary')
                        .setDisabled(currentPage === 0),
                    new ButtonBuilder()
                        .setCustomId(`${uniqueId}_next`)
                        .setLabel('Next')
                        .setStyle('Primary')
                        .setDisabled(currentPage === embeds.length - 1),
                    new ButtonBuilder()
                        .setCustomId(`${uniqueId}_delete`)
                        .setLabel('Delete Prediction')
                        .setStyle('Danger')
                );

            // Envoyer le premier embed
            const message = await interaction.reply({
                embeds: [embeds[currentPage]],
                components: [row],
                fetchReply: true,
                ephemeral: true
            });

            // Collecteur pour gérer les interactions avec les boutons
            const filter = i => i.customId.startsWith(uniqueId);
            const collector = message.createMessageComponentCollector({ filter, time: 60000 });

            collector.on('collect', async (i) => {
                if (i.user.id !== interaction.user.id) return; // Vérifie que c'est bien l'utilisateur qui a lancé la commande

                if (i.customId.endsWith('_next')) {
                    currentPage++;
                } else if (i.customId.endsWith('_previous')) {
                    currentPage--;
                } else if (i.customId.endsWith('_delete')) {
                    // Code pour supprimer la prédiction
                    const predictionId = predictions.data[currentPage].id; // Assurez-vous que l'ID de la prédiction est correct

                    try {
                        await api.delete(`/api/predictions/${predictionId}`);
                        await i.update({
                            content: 'Prediction deleted successfully. 🗑️✅',
                            components: [],
                            ephemeral: true
                        });
                        return;
                    } catch (deleteError) {
                        console.error('Error deleting prediction:', deleteError);
                        await i.update({
                            content: 'An error occurred while deleting the prediction.',
                            components: [],
                            ephemeral: true
                        });
                        return;
                    }
                }

                // Met à jour les boutons et l'embed
                await i.update({
                    embeds: [embeds[currentPage]],
                    components: [
                        new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId(`${uniqueId}_previous`)
                                    .setLabel('Previous')
                                    .setStyle('Primary')
                                    .setDisabled(currentPage === 0),
                                new ButtonBuilder()
                                    .setCustomId(`${uniqueId}_next`)
                                    .setLabel('Next')
                                    .setStyle('Primary')
                                    .setDisabled(currentPage === embeds.length - 1),
                                new ButtonBuilder()
                                    .setCustomId(`${uniqueId}_delete`)
                                    .setLabel('Delete Prediction')
                                    .setStyle('Danger')
                            )]
                });
            });

            collector.on('end', async () => {
                // Désactive les boutons après 60 secondes
                const disabledRow = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`${uniqueId}_previous`)
                            .setLabel('Previous')
                            .setStyle('Primary')
                            .setDisabled(true),
                        new ButtonBuilder()
                            .setCustomId(`${uniqueId}_next`)
                            .setLabel('Next')
                            .setStyle('Primary')
                            .setDisabled(true),
                        new ButtonBuilder()
                            .setCustomId(`${uniqueId}_delete`)
                            .setLabel('Delete Prediction')
                            .setStyle('Danger')
                            .setDisabled(true)
                    );

                // Met à jour le message pour désactiver les boutons
                try {
                    await message.edit({ components: [disabledRow] });
                } catch (editError) {
                    console.error('Error editing message:', editError);
                }
            });

        } catch (error) {
            console.error('Error fetching predictions:', error);
            try {
                await interaction.reply({ content: 'An error occurred while fetching your predictions.', ephemeral: true });
            } catch (replyError) {
                console.error('Error sending error message:', replyError);
            }
        }
    },
};
