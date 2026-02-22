import {
  type ChatInputCommandInteraction,
  SlashCommandBuilder,
} from 'discord.js'
import { getLatestUsage, scrapeUsage } from '../../utils/usage-monitor.js'
import type { UsageSnapshot, UsageReport } from '../../utils/usage-monitor.js'
import { COLORS, createEmbed } from '../theme.js'

export const data = new SlashCommandBuilder()
  .setName('usage')
  .setDescription('LLM使用量を確認')
  .addBooleanOption((opt) =>
    opt
      .setName('refresh')
      .setDescription('最新データを取得する（時間がかかります）')
      .setRequired(false),
  )

function formatSnapshot(snapshot: UsageSnapshot | null): string {
  if (!snapshot) return 'データなし（まだ取得されていません）'
  if (snapshot.error) return `**エラー**: ${snapshot.error.slice(0, 200)}`
  if (!snapshot.parsed) return snapshot.raw.slice(0, 300) || 'パース失敗'

  const parts: string[] = []
  if (snapshot.parsed.usagePercent !== undefined) {
    parts.push(`使用率: **${snapshot.parsed.usagePercent}%**`)
  }
  if (snapshot.parsed.resetAt) {
    parts.push(`リセット: ${snapshot.parsed.resetAt}`)
  }
  parts.push(snapshot.parsed.summary)
  return parts.join('\n').slice(0, 1024)
}

function buildUsageEmbed(report: UsageReport) {
  const fields: Array<{ name: string; value: string; inline?: boolean }> = []

  fields.push({
    name: 'Claude (Max)',
    value: formatSnapshot(report.claude),
    inline: false,
  })

  fields.push({
    name: 'OpenAI Codex',
    value: formatSnapshot(report.codex),
    inline: false,
  })

  const hasErrors = report.claude?.error ?? report.codex?.error
  const highUsage =
    (report.claude?.parsed?.usagePercent ?? 0) >= 80 ||
    (report.codex?.parsed?.usagePercent ?? 0) >= 80
  const color = hasErrors ? COLORS.error : highUsage ? COLORS.warning : COLORS.info

  return createEmbed(color, 'LLM 使用量', {
    fields,
    footer: `最終取得: ${new Date(report.scrapedAt).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}`,
  })
}

export async function execute(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const refresh = interaction.options.getBoolean('refresh') ?? false

  if (refresh) {
    await interaction.deferReply()
    const report = await scrapeUsage()
    const embed = buildUsageEmbed(report)
    await interaction.editReply({ embeds: [embed] })
  } else {
    const report = getLatestUsage()
    const embed = buildUsageEmbed(report)
    await interaction.reply({ embeds: [embed] })
  }
}
