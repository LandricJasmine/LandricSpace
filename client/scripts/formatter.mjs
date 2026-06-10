import axios from 'axios'
import stylishFormatter from './stylish-formatter.mjs'
import { createMinimalClient, CustomPlugin } from './reporter.mjs'

const client = createMinimalClient()
const projectId = process.env.COZE_PROJECT_ID ?? ''

CustomPlugin(client);

client.init({
  bid: 'coze_vibe_app',
  transport: {
    get: ({
      success,
      fail,
      ...otherOptions
    }) => {
      axios({
        method: 'get',
        ...otherOptions,
      }).then((res) => {
        success && success(res.data)
      }).catch(fail)
    },
    post: options => {
      axios({
        method: 'post',
        ...options,
      }).finally(() => {
        console.log('\n')
      })
    },
  }
})

client.start()

function normalizeESLintRuleId(ruleId) {
  return ruleId?.replace(/[/-]/g, '_')
}

function reportESLintRulesMetrics(results) {
  const metrics = {}
  for (const { messages } of results) {
    for (const message of messages) {
      if (message.severity !== 2) {
        continue
      }

      const normalizedRuleId = normalizeESLintRuleId(message.ruleId)
      if (!normalizedRuleId) {
        continue
      }
      metrics[normalizedRuleId] = (metrics[normalizedRuleId] ?? 0) + 1
    }
  }
  try {
    client.sendEvent({
      name: 'eslint_rules',
      metrics,
      categories: {
        project_id: projectId,
      },
    })
  } catch (e) {

  }
}

function formatter(results, data) {
  if (projectId) {
    reportESLintRulesMetrics(results)
  }

  return stylishFormatter(results, data)
}

export default formatter
