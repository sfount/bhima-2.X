angular.module('bhima.components')
  .component('bhVoucherToolsCorrect', {
    templateUrl : 'modules/voucher-tools/correct/voucher-tools.correct.tmpl.html',
    controller : bhVoucherToolsCorrect,
    bindings : {
      source : '<',
      onClose : '&?',
      showBadge : '@?',
    },
  });

bhVoucherToolsCorrect.$inject = ['VoucherToolsService', '$translate'];

function bhVoucherToolsCorrect(VoucherTools, $translate) {
  const $ctrl = this;
  const VOUCHER_TOOLS_REVERSE_DESCRIPTION = 'VOUCHERS.TOOLS.REVERSE.DESCRIPTION';
  const VOUCHER_TOOLS_CORRECTION_DESCRIPTION = 'VOUCHERS.TOOLS.CORRECT.DESCRIPTION';

  // @TODO(sfount) state management and templates for both voucher tools are very
  // similar, a component should be used to abstract the duplicated code from both
  // of these tools
  $ctrl.state = {
    input : true,
    errored : false,
    pending : false,
    flag : null
  };

  $ctrl.onTestRoutine = function onTestRoutine() {
    const formattedCorrectionRequest = sanitiseTransactionDetails($ctrl.input.shared, $ctrl.input.rows);

    $ctrl.pending = true;

    // @TODO(sfount) format voucher details for the server
    VoucherTools.correctTransaction(formattedCorrectionRequest.transactionDetails.record_uuid, formattedCorrectionRequest)
      .then((result) => {
        console.log('client component got result', result);

        $ctrl.state.input = false;
        $ctrl.state.errored = false;
        $ctrl.state.pending = false;
      })
      .catch((error) => {
        console.log('client component failed with', error);

        $ctrl.state.pending = false;
        $ctrl.state.errored = true;
        $ctrl.state.flag = error.data.code;
      });
  };

  $ctrl.$onChanges = function onChanges(changes) {
    if (changes.source && changes.source.currentValue) {
      $ctrl.input = changes.source.currentValue;
    }
  };

  // format data provided by the transaction modal as required by the server
  // side voucher tools API
  function sanitiseTransactionDetails(sharedTransactionDetails, transactionRows) {
    const formattedCorrection = {};
    const voucherSharedAttributes = ['record_uuid', 'user_id', 'project_id', 'currency_id', 'trans_id'];
    const voucherRowAttributes = ['account_id', 'credit', 'debit', 'description', 'entity_uuid', 'reference_uuid'];

    // the current transaction that should be reversed
    // take only the shared voucher attributes and collect them in a new object
    formattedCorrection.transactionDetails = _reduceSharedAttributes(voucherSharedAttributes, sharedTransactionDetails);
    formattedCorrection.transactionDetails.description = `
      ${$translate.instant(VOUCHER_TOOLS_REVERSE_DESCRIPTION)} ${formattedCorrection.transactionDetails.trans_id}
    `;
    formattedCorrection.transactionDetails.correctionDescription = `
      ${$translate.instant(VOUCHER_TOOLS_CORRECTION_DESCRIPTION)} ${formattedCorrection.transactionDetails.trans_id}
    `;

    // the proposed rows for the new voucher to replace this transaction
    formattedCorrection.correction = transactionRows.map((row) => {
      return _reduceSharedAttributes(voucherRowAttributes, row);
    });
    return formattedCorrection;
  }

  // small helper method to reduce shared attributes into a new object
  function _reduceSharedAttributes(attributes, source) {
    return attributes.reduce((aggregate, key) => {
      aggregate[key] = source[key];
      return aggregate;
    }, {});
  }
}
