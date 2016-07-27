import { addIssueLabels } from '../../utils/github'
import { addInterpretation, addLabel } from './index';


addInterpretation(addLabel, ({ label }, { labelsUrl }) => {
    return addIssueLabels(labelsUrl, [label])
})